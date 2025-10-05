from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import torch, os, uuid, json
import numpy as np
from PIL import Image
import cv2

# import your model & classifier from model_core
from model_core import model, device, classify_anomalies

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app = FastAPI()

@app.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    uid = str(uuid.uuid4())
    temp_path = os.path.join(BASE_DIR, f"{uid}_{file.filename}")

    # save uploaded file temporarily
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    # run inference
    img = Image.open(temp_path).convert("RGB")
    img_tensor = torch.tensor(np.array(img)).permute(2,0,1).unsqueeze(0).float()/255.0
    img_tensor = img_tensor.to(device)

    with torch.no_grad():
        output = model(img_tensor)
        if hasattr(output, 'anomaly_map'):
            anomaly_map = output.anomaly_map.squeeze().cpu().numpy()
        elif isinstance(output, (tuple, list)) and len(output) > 1:
            anomaly_map = output[1].squeeze().cpu().numpy()
        else:
            anomaly_map = None

    # post-process
    orig_np = np.array(img)
    if anomaly_map is not None:
        norm_map = (255 * (anomaly_map - anomaly_map.min()) / (np.ptp(anomaly_map) + 1e-8)).astype(np.uint8)
        mask_img = Image.fromarray(norm_map).resize(img.size, resample=Image.BILINEAR)
        bin_mask = np.array(mask_img) > 128
    else:
        bin_mask = np.zeros_like(orig_np[:,:,0], dtype=bool)

    filtered_img = np.zeros_like(orig_np)
    filtered_img[bin_mask] = orig_np[bin_mask]

    # classify anomalies
    _, box_list, label_list, conf_list, severities = classify_anomalies(filtered_img, anomaly_map=anomaly_map)

    # format JSON
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

    # cleanup temp file
    os.remove(temp_path)

    # return result
    return JSONResponse(content=jsonable_encoder(annotation))
