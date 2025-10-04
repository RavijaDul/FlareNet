import os
import torch
import numpy as np
import cv2
from PIL import Image
import pickle
from collections import deque
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import FileResponse
import uvicorn
import uuid

# -------------------------
# Paths
# -------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_FILE = os.path.join(BASE_DIR, "model_weights", "patchcore_model.pkl")
OUT_DIR = os.path.join(BASE_DIR, "outputs")

# Create output directory
os.makedirs(OUT_DIR, exist_ok=True)

# -------------------------
# Load model
# -------------------------
print("🔹 Loading model from saved file...")
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
with open(MODEL_FILE, "rb") as f:
    model = pickle.load(f)
model.eval()
model = model.to(device)
print("✅ Model loaded for inference.")

# -------------------------
# Heuristic anomaly classification
# -------------------------
def classify_anomalies(filtered_img):
    hsv = cv2.cvtColor(filtered_img, cv2.COLOR_RGB2HSV)
    h, w = filtered_img.shape[:2]
    total_area = float(w * h)

    mask = np.zeros((h, w), dtype=np.uint8)
    for y in range(h):
        for x in range(w):
            H, S, V = hsv[y, x]
            hC, sC, vC = H/180.0, S/255.0, V/255.0
            warm_hue = (hC <= 0.17) or (hC >= 0.95)
            warm_sat = sC >= 0.35
            warm_val = vC >= 0.5
            if warm_hue and warm_sat and warm_val:
                mask[y, x] = 1

    # Ignore right 10% sidebar
    sidebar_width = int(w * 0.10)
    mask[:, w - sidebar_width : w] = 0

    visited = np.zeros_like(mask, dtype=bool)
    boxes, labels = [], []
    dirs = [(1,0),(-1,0),(0,1),(0,-1)]
    min_area = max(32, int(w*h*0.001))

    for y in range(h):
        for x in range(w):
            if mask[y, x] and not visited[y, x]:
                q = deque([(x,y)])
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
                        nx, ny = px+dx, py+dy
                        if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not visited[ny, nx]:
                            visited[ny, nx] = True
                            q.append((nx, ny))
                if area >= min_area:
                    boxes.append((minX, minY, maxX-minX+1, maxY-minY+1))

    for (x,y,bw,bh) in boxes:
        area_frac = (bw*bh)/total_area
        aspect = max(bw, bh)/max(1.0, min(bw, bh))
        center_x0, center_y0 = int(w*0.33), int(h*0.33)
        center_x1, center_y1 = int(w*0.67), int(h*0.67)
        ox0, oy0 = max(x, center_x0), max(y, center_y0)
        ox1, oy1 = min(x+bw, center_x1), min(y+bh, center_y1)
        overlap = max(0, ox1-ox0) * max(0, oy1-oy0)
        overlap_frac = overlap/(bw*bh)

        if area_frac >= 0.10 and (overlap_frac >= 0.4 or area_frac >= 0.30):
            labels.append("Loose Joint")
        elif aspect >= 2.0:
            labels.append("Wire Overload")
        else:
            labels.append("Point Overload")

    if not boxes:
        return "Normal", [], []
    return None, boxes, labels

# -------------------------
# Inference function
# -------------------------
def run_inference(image_path, out_prefix):
    img = Image.open(image_path).convert("RGB")
    img_tensor = torch.tensor(np.array(img)).permute(2,0,1).unsqueeze(0).float()/255.0
    img_tensor = img_tensor.to(device)

    with torch.no_grad():
        output = model(img_tensor)
        if hasattr(output, 'anomaly_map'):
            anomaly_map = output.anomaly_map.squeeze().cpu().numpy()
        elif isinstance(output, (tuple, list)) and len(output) > 1:
            anomaly_map = output[1].squeeze().cpu().numpy()
        else:
            raise RuntimeError("No anomaly map generated from model.")

    norm_map = (255 * (anomaly_map - anomaly_map.min()) / (np.ptp(anomaly_map) + 1e-8)).astype(np.uint8)
    mask_img = Image.fromarray(norm_map).resize(img.size, resample=Image.BILINEAR)
    bin_mask = np.array(mask_img) > 128
    orig_np = np.array(img)
    filtered_img = np.zeros_like(orig_np)
    filtered_img[bin_mask] = orig_np[bin_mask]

    image_label, box_list, label_list = classify_anomalies(filtered_img)

    # Save segmented image
    segmented_img = filtered_img.copy()
    for (x,y,wb,hb), l in zip(box_list,label_list):
        cv2.rectangle(segmented_img,(x,y),(x+wb,y+hb),(0,0,255),2)
        cv2.putText(segmented_img,l,(x,y-10),cv2.FONT_HERSHEY_SIMPLEX,0.6,(0,255,255),2)
    if not box_list:
        cv2.putText(segmented_img,"Normal",(10,30),cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,255),2)

    segmented_path = os.path.join(OUT_DIR, f"{out_prefix}_seg.png")
    cv2.imwrite(segmented_path, cv2.cvtColor(segmented_img, cv2.COLOR_RGB2BGR))

    # Save final labeled image
    final_img = orig_np.copy()
    for (x,y,wb,hb), l in zip(box_list,label_list):
        cv2.rectangle(final_img,(x,y),(x+wb,y+hb),(0,0,255),2)
        cv2.putText(final_img,l,(x,y-10),cv2.FONT_HERSHEY_SIMPLEX,0.6,(0,255,255),2)
    if not box_list:
        cv2.putText(final_img,"Normal",(10,30),cv2.FONT_HERSHEY_SIMPLEX,1,(0,255,255),2)

    final_path = os.path.join(OUT_DIR, f"{out_prefix}_final.png")
    cv2.imwrite(final_path, cv2.cvtColor(final_img, cv2.COLOR_RGB2BGR))

    return image_label, box_list, label_list, segmented_path, final_path

# -------------------------
# FastAPI App
# -------------------------
app = FastAPI()

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    # Save upload
    uid = str(uuid.uuid4())
    temp_path = os.path.join(OUT_DIR, f"{uid}_{file.filename}")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    image_label, boxes, labels, segmented_path, final_path = run_inference(temp_path, uid)

    return {
        "status": "ok",
        "main_label": image_label,
        "boxes": boxes,
        "labels": labels,
        "segmented_url": segmented_path,
        "final_url": final_path
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
