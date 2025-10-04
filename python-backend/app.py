import os
import torch
import numpy as np
import cv2
from PIL import Image
import pickle
from collections import deque
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import uuid

# -------------------------
# 🔹 Load model
# -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "model_weights", "patchcore_model.pkl")

print("🔹 Loading model...")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
with open(MODEL_FILE, "rb") as f:
    model = pickle.load(f)
model.eval()
model = model.to(device)
print("✅ Model ready.")


# -------------------------
# 🔹 Anomaly classification with severity
# -------------------------
def classify_anomalies(filtered_img, anomaly_map=None, sensitivity=40):
    hsv = cv2.cvtColor(filtered_img, cv2.COLOR_RGB2HSV)
    h, w = filtered_img.shape[:2]
    total_area = float(w * h)
    k = 1.1 + (sensitivity / 100.0) * (2.1 - 1.1)

    # Adaptive anomaly threshold
    if anomaly_map is not None:
        thresh = anomaly_map.mean() + k * anomaly_map.std()
        bin_mask = anomaly_map > thresh
    else:
        bin_mask = np.zeros((h, w), dtype=bool)

    # Warm color detection
    mask = np.zeros((h, w), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            H, S, V = hsv[y, x]
            hC, sC, vC = H / 180.0, S / 255.0, V / 255.0
            warm_hue = (hC <= 0.17) or (hC >= 0.95)
            warm_sat = sC >= 0.35
            warm_val = vC >= 0.5
            if warm_hue and warm_sat and warm_val:
                mask[y, x] = 1

    sidebar_width = int(w * 0.10)
    mask[:, w - sidebar_width:] = 0

    # Connected components
    visited = np.zeros_like(mask, dtype=bool)
    boxes, labels, confidences, severities = [], [], [], []
    dirs = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    min_area = max(32, int(w * h * 0.001))

    for y in range(h):
        for x in range(w):
            if mask[y, x] and not visited[y, x]:
                q = deque([(x, y)])
                visited[y, x] = True
                minX = maxX = x
                minY = maxY = y
                area = 0
                while q:
                    px, py = q.popleft()
                    area += 1
                    minX, maxX = min(minX, px), max(maxX, px)
                    minY, maxY = min(minY, py), max(maxY, py)
                    for dx, dy in dirs:
                        nx, ny = px + dx, py + dy
                        if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((nx, ny))
                if area >= min_area:
                    boxes.append((minX, minY, maxX - minX + 1, maxY - minY + 1))

    for (x, y, bw, bh) in boxes:
        area_frac = (bw * bh) / total_area
        aspect = max(bw, bh) / max(1.0, min(bw, bh))
        center_x0, center_y0 = int(w * 0.33), int(h * 0.33)
        center_x1, center_y1 = int(w * 0.67), int(h * 0.67)
        ox0, oy0 = max(x, center_x0), max(y, center_y0)
        ox1, oy1 = min(x + bw, center_x1), min(y + bh, center_y1)
        overlap = max(0, ox1 - ox0) * max(0, oy1 - oy0)
        overlap_frac = overlap / (bw * bh)

        # Color severity logic
        box_hsv = hsv[y:y+bh, x:x+bw, :].astype(np.float32)
        H, S, V = box_hsv[..., 0], box_hsv[..., 1], box_hsv[..., 2]
        red_mask = ((H <= 10) | (H >= 160)) & (S >= 100) & (V >= 100)
        orange_mask = (H > 10) & (H <= 25) & (S >= 100) & (V >= 100)
        yellow_mask = (H > 25) & (H <= 35) & (S >= 100) & (V >= 100)

        warm_mask_local = red_mask | orange_mask | yellow_mask
        warm_count = np.count_nonzero(warm_mask_local)
        red_orange_frac = np.count_nonzero(red_mask | orange_mask) / float(warm_count) if warm_count > 0 else 0.0

        v_mean = float(np.mean(V / 255.0))

        # Label & severity rules
        if area_frac >= 0.10 and (overlap_frac >= 0.4 or area_frac >= 0.30):
            label = "Loose Joint"
        elif aspect >= 2.0:
            label = "Wire Overload"
        else:
            label = "Point Overload"

        severity = "Faulty" if red_orange_frac >= 0.5 else "Potentially Faulty"
        confidence = round(min(1.0, 0.6 + 0.8 * area_frac), 2)

        boxes[-1] = (x, y, bw, bh)
        labels.append(label)
        confidences.append(confidence)
        severities.append(severity)

    if not boxes:
        return "Normal", [], [], [], []

    return None, boxes, labels, confidences, severities


# -------------------------
# 🔹 Inference
# -------------------------
def run_inference(image_path):
    img = Image.open(image_path).convert("RGB")
    img_tensor = torch.tensor(np.array(img)).permute(2, 0, 1).unsqueeze(0).float() / 255.0
    img_tensor = img_tensor.to(device)

    with torch.no_grad():
        output = model(img_tensor)
        if hasattr(output, 'anomaly_map'):
            anomaly_map = output.anomaly_map.squeeze().cpu().numpy()
        elif isinstance(output, (tuple, list)) and len(output) > 1:
            anomaly_map = output[1].squeeze().cpu().numpy()
        else:
            anomaly_map = None

    orig_np = np.array(img)
    image_label, box_list, label_list, conf_list, severities = classify_anomalies(orig_np, anomaly_map)

    annotation = {
        "status": "Normal" if not box_list else "Anomalies",
        "anomalies": []
    }

    for (x, y, wb, hb), label, conf, sev in zip(box_list, label_list, conf_list, severities):
        lname = label.lower()
        category = (
            "loose_joint" if "loose" in lname else
            "wire_overload" if "wire" in lname else
            "point_overload" if "point" in lname else
            "anomaly"
        )
        annotation["anomalies"].append({
            "label": label,
            "category": category,
            "severity": sev,
            "confidence": float(conf),
            "bbox": {"x": int(x), "y": int(y), "width": int(wb), "height": int(hb)}
        })

    return annotation


# -------------------------
# 🔹 FastAPI App
# -------------------------
app = FastAPI()

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    uid = str(uuid.uuid4())
    temp_path = os.path.join(BASE_DIR, f"{uid}_{file.filename}")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    result = run_inference(temp_path)
    os.remove(temp_path)

    # ✅ JSON-safe response
    return JSONResponse(content=jsonable_encoder(result))




# import os
# import torch
# import numpy as np
# import cv2
# from PIL import Image
# import pickle
# from collections import deque
# from fastapi import FastAPI, File, UploadFile
# import uuid

# BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# MODEL_FILE = os.path.join(BASE_DIR, "model_weights", "patchcore_model.pkl")

# print("🔹 Loading model...")
# device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# with open(MODEL_FILE, "rb") as f:
#     model = pickle.load(f)
# model.eval()
# model = model.to(device)
# print("✅ Model ready.")

# def classify_anomalies(filtered_img, anomaly_map=None, sensitivity=40):
#     hsv = cv2.cvtColor(filtered_img, cv2.COLOR_RGB2HSV)
#     h, w = filtered_img.shape[:2]
#     total_area = float(w * h)
#     k = 1.1 + (sensitivity / 100.0) * (2.1 - 1.1)

#     if anomaly_map is not None:
#         thresh = anomaly_map.mean() + k * anomaly_map.std()
#         bin_mask = anomaly_map > thresh
#     else:
#         bin_mask = np.zeros((h, w), dtype=bool)

#     mask = np.zeros((h, w), dtype=np.uint8)
#     for y in range(h):
#         for x in range(w):
#             H, S, V = hsv[y, x]
#             hC, sC, vC = H / 180.0, S / 255.0, V / 255.0
#             warm_hue = (hC <= 0.17) or (hC >= 0.95)
#             warm_sat = sC >= 0.35
#             warm_val = vC >= 0.5
#             if warm_hue and warm_sat and warm_val:
#                 mask[y, x] = 1
#     sidebar_width = int(w * 0.10)
#     mask[:, w - sidebar_width:] = 0

#     visited = np.zeros_like(mask, dtype=bool)
#     boxes, labels, confidences = [], [], []
#     dirs = [(1,0),(-1,0),(0,1),(0,-1)]
#     min_area = max(32, int(w*h*0.001))

#     for y in range(h):
#         for x in range(w):
#             if mask[y, x] and not visited[y, x]:
#                 q = deque([(x,y)])
#                 visited[y, x] = True
#                 minX = maxX = x
#                 minY = maxY = y
#                 area = 0
#                 while q:
#                     px, py = q.popleft()
#                     area += 1
#                     minX, maxX = min(minX, px), max(maxX, px)
#                     minY, maxY = min(minY, py), max(maxY, py)
#                     for dx, dy in dirs:
#                         nx, ny = px+dx, py+dy
#                         if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not visited[ny, nx]:
#                             visited[ny, nx] = True
#                             q.append((nx, ny))
#                 if area >= min_area:
#                     boxes.append((minX, minY, maxX-minX+1, maxY-minY+1))

#     for (x,y,bw,bh) in boxes:
#         area_frac = (bw*bh)/total_area
#         aspect = max(bw, bh)/max(1.0, min(bw, bh))
#         center_x0, center_y0 = int(w*0.33), int(h*0.33)
#         center_x1, center_y1 = int(w*0.67), int(h*0.67)
#         ox0, oy0 = max(x, center_x0), max(y, center_y0)
#         ox1, oy1 = min(x+bw, center_x1), min(y+bh, center_y1)
#         overlap = max(0, ox1-ox0) * max(0, oy1-oy0)
#         overlap_frac = overlap/(bw*bh)
#         v_mean = np.mean(hsv[y:y+bh, x:x+bw, 2]/255.0)

#         if area_frac >= 0.10 and (overlap_frac >= 0.4 or area_frac >= 0.30):
#             labels.append("Loose Joint")
#             confidences.append(round(min(1.0, 0.6 + 0.8*area_frac), 2))
#         elif aspect >= 2.0:
#             labels.append("Wire Overload")
#             confidences.append(round(min(1.0, 0.5 + 0.2*aspect), 2))
#         else:
#             labels.append("Point Overload")
#             confidences.append(round(min(1.0, 0.5 + 0.5*v_mean), 2))

#     if not boxes:
#         return "Normal", [], [], []
#     return None, boxes, labels, confidences

# def run_inference(image_path):
#     img = Image.open(image_path).convert("RGB")
#     img_tensor = torch.tensor(np.array(img)).permute(2,0,1).unsqueeze(0).float()/255.0
#     img_tensor = img_tensor.to(device)

#     with torch.no_grad():
#         output = model(img_tensor)
#         if hasattr(output, 'anomaly_map'):
#             anomaly_map = output.anomaly_map.squeeze().cpu().numpy()
#         elif isinstance(output, (tuple, list)) and len(output) > 1:
#             anomaly_map = output[1].squeeze().cpu().numpy()
#         else:
#             anomaly_map = None

#     orig_np = np.array(img)
#     image_label, box_list, label_list, conf_list = classify_anomalies(orig_np, anomaly_map)

#     annotation = {
#         "status": "Normal" if not box_list else "Anomalies",
#         "anomalies": []
#     }

#     for (x, y, wb, hb), label, conf in zip(box_list, label_list, conf_list):
#         lname = label.lower()
#         category = (
#             "loose_joint" if "loose" in lname else
#             "wire_overload" if "wire" in lname else
#             "point_overload" if "point" in lname else
#             "anomaly"
#         )
#         annotation["anomalies"].append({
#             "label": label,
#             "category": category,
#             "confidence": conf,
#             "bbox": {"x": int(x), "y": int(y), "width": int(wb), "height": int(hb)}
#         })
#     return annotation

# app = FastAPI()

# @app.post("/analyze")
# async def analyze(file: UploadFile = File(...)):
#     uid = str(uuid.uuid4())
#     temp_path = os.path.join(BASE_DIR, f"{uid}_{file.filename}")
#     with open(temp_path, "wb") as f:
#         f.write(await file.read())

#     result = run_inference(temp_path)
#     os.remove(temp_path)
#     return result
