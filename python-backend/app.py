from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
import torch, os, uuid, json
import numpy as np
from PIL import Image
import cv2
from typing import List, Dict, Any, Optional

# import your model & classifier from model_core
from model_core import (
    model, device, classify_anomalies_adaptive, 
    process_user_feedback_api, get_current_parameters
)

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
    _, box_list, label_list, conf_list, severities = classify_anomalies_adaptive(filtered_img, anomaly_map=anomaly_map)

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

@app.post("/feedback")
async def process_feedback(feedback_data: dict):
    """
    Process user feedback for adaptive learning
    Expected format matches your database structure
    """
    try:
        # Extract required fields
        image_id = feedback_data.get("image_id", "unknown")
        user_id = feedback_data.get("user_id", "user")
        
        # Extract original detections from analysis_result format
        original_analysis = feedback_data.get("original_detections", {})
        original_detections = []
        
        if "anomalies" in original_analysis:
            for i, anomaly in enumerate(original_analysis["anomalies"]):
                original_detections.append({
                    "id": f"orig_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"),
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {})
                })
        
        # Extract user corrections from user_annotations format
        user_annotations = feedback_data.get("user_corrections", {})
        user_corrections = []
        
        if "anomalies" in user_annotations:
            for i, anomaly in enumerate(user_annotations["anomalies"]):
                # Skip if deleted by user
                if anomaly.get("isDeleted", False):
                    continue
                    
                user_corrections.append({
                    "id": f"corr_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"), 
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {}),
                    "isUserAdded": anomaly.get("isUserAdded", False),
                    "edited": anomaly.get("edited", False)
                })
        
        # Process feedback through adaptive system
        result = process_user_feedback_api(image_id, user_id, original_detections, user_corrections)
        
        # Return success response
        return JSONResponse(content={
            "status": "success",
            "message": result.get("message", "Feedback processed"),
            "adaptations_applied": result.get("adaptations_applied", []),
            "feedback_count": result.get("feedback_count", 0),
            "current_parameters": get_current_parameters()
        })
        
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error", 
                "message": f"Error processing feedback: {str(e)}"
            }
        )

@app.post("/adaptive-feedback")
async def adaptive_feedback(request_data: dict):
    """
    Main endpoint for processing adaptive feedback from Java backend
    Call this when user saves annotations in AnnotationController
    """
    try:
        print(f" Adaptive feedback received: {request_data.keys()}")
        
        thermal_image_id = request_data.get("thermalImageId", request_data.get("thermal_image_id"))
        user_id = request_data.get("userId", request_data.get("user_id", "unknown"))
        original_analysis_json = request_data.get("originalAnalysisJson", "{}")
        user_annotations_json = request_data.get("userAnnotationsJson", "{}")
        
        print(f" Processing feedback for image {thermal_image_id} by user {user_id}")
        
        # Parse JSON strings from database if needed
        if isinstance(original_analysis_json, str):
            original_analysis = json.loads(original_analysis_json) if original_analysis_json else {}
        else:
            original_analysis = original_analysis_json
            
        if isinstance(user_annotations_json, str):
            user_annotations = json.loads(user_annotations_json) if user_annotations_json else {}
        else:
            user_annotations = user_annotations_json
        
        print(f" Original detections: {len(original_analysis.get('anomalies', []))}")
        print(f" User annotations: {len(user_annotations.get('anomalies', []))}")
        
        # Extract original detections from analysis_result format
        original_detections = []
        if original_analysis and "anomalies" in original_analysis:
            for i, anomaly in enumerate(original_analysis["anomalies"]):
                original_detections.append({
                    "id": f"orig_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"),
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {})
                })
        
        # Extract user corrections from user_annotations format
        user_corrections = []
        deleted_count = 0
        added_count = 0
        edited_count = 0
        
        if user_annotations and "anomalies" in user_annotations:
            for i, anomaly in enumerate(user_annotations["anomalies"]):
                if anomaly.get("isDeleted", False):
                    deleted_count += 1
                    continue
                    
                if anomaly.get("isUserAdded", False):
                    added_count += 1
                    
                if anomaly.get("edited", False):
                    edited_count += 1
                    
                user_corrections.append({
                    "id": f"corr_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"),
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {}),
                    "isUserAdded": anomaly.get("isUserAdded", False),
                    "edited": anomaly.get("edited", False)
                })
        
        print(f" Feedback stats: {len(original_detections)} orig, {len(user_corrections)} corrected, {deleted_count} deleted, {added_count} added")
        
        # Process through adaptive system
        if original_detections or user_corrections or deleted_count > 0:
            result = process_user_feedback_api(str(thermal_image_id), user_id, original_detections, user_corrections)
            
            print(f" Adaptations applied: {result.get('adaptations_applied', [])}")
            print(f" Current threshold: {result.get('current_threshold', 50)}")
            
            return JSONResponse(content={
                "status": "success",
                "thermalImageId": thermal_image_id,
                "message": f"Adaptive learning completed for image {thermal_image_id}",
                "adaptationsApplied": result.get("adaptations_applied", []),
                "feedbackProcessed": result.get("feedback_count", 0),
                "statistics": {
                    "originalDetections": len(original_detections),
                    "userCorrections": len(user_corrections), 
                    "deletedAnnotations": deleted_count,
                    "addedAnnotations": added_count,
                    "editedAnnotations": edited_count
                },
                "currentThreshold": result.get("current_threshold", 50),
                "learningActive": True
            })
        else:
            print("ℹ No feedback changes detected")
            return JSONResponse(content={
                "status": "success",
                "message": "No feedback to process",
                "learningActive": False
            })
        
    except Exception as e:
        print(f" Adaptive learning error: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Adaptive learning failed: {str(e)}",
                "learningActive": False
            }
        )

@app.get("/parameters")
async def get_adaptive_parameters():
    """Get current adaptive parameters"""
    try:
        params = get_current_parameters()
        return JSONResponse(content={
            "status": "success",
            "parameters": params
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Error getting parameters: {str(e)}"
            }
        )
