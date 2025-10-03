from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import List, Optional
import logging
import aiofiles
import uuid
from pathlib import Path

from config import STORAGE_CONFIG
from services.ml_inference import MLInferenceService

logger = logging.getLogger(__name__)
router = APIRouter()

async def get_ml_service(request: Request) -> MLInferenceService:
    """Get ML service instance from app state"""
    ml_service = getattr(request.app.state, 'ml_service', None)
    if not ml_service or not ml_service.is_ready():
        raise HTTPException(
            status_code=503, 
            detail="ML service not available"
        )
    return ml_service

async def save_uploaded_file(file: UploadFile) -> Path:
    """Save uploaded file to temporary storage"""
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    file_extension = Path(file.filename).suffix.lower()
    if file_extension not in STORAGE_CONFIG["allowed_extensions"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file type. Allowed: {STORAGE_CONFIG['allowed_extensions']}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4().hex}{file_extension}"
    file_path = STORAGE_CONFIG["upload_dir"] / unique_filename
    
    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            if len(content) > STORAGE_CONFIG["max_file_size"]:
                raise HTTPException(
                    status_code=413, 
                    detail="File too large"
                )
            await f.write(content)
        
        logger.info(f"File saved: {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Failed to save file")

@router.post("/api/v1/detect-anomaly")
async def detect_anomaly(
    request: Request,
    file: UploadFile = File(...),
    return_visualizations: bool = Form(True),
    threshold: float = Form(0.5)
):
    """
    Detect anomalies in a single thermal image
    
    Args:
        file: Image file (JPG/PNG)
        return_visualizations: Whether to generate visualization images
        threshold: Anomaly threshold for classification
        
    Returns:
        JSON response with anomaly detection results
    """
    ml_service = await get_ml_service(request)
    file_path = None
    
    try:
        # Save uploaded file
        file_path = await save_uploaded_file(file)
        
        # Process image
        result = await ml_service.process_single_image(
            image_path=file_path,
            return_visualizations=return_visualizations,
            threshold=threshold
        )
        
        # Add original filename to result
        result["original_filename"] = file.filename
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in detect_anomaly: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup uploaded file
        if file_path and file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to cleanup file {file_path}: {e}")

@router.post("/api/v1/batch-detect")
async def batch_detect_anomalies(
    request: Request,
    files: List[UploadFile] = File(...),
    return_visualizations: bool = Form(True)
):
    """
    Detect anomalies in multiple thermal images
    
    Args:
        files: List of image files
        return_visualizations: Whether to generate visualizations
        
    Returns:
        JSON response with batch processing results
    """
    ml_service = await get_ml_service(request)
    saved_files = []
    
    try:
        # Validate batch size
        if len(files) > 20:  # Reasonable limit
            raise HTTPException(
                status_code=400, 
                detail="Too many files. Maximum 20 files per batch."
            )
        
        # Save all uploaded files
        for file in files:
            file_path = await save_uploaded_file(file)
            saved_files.append(file_path)
        
        # Process batch
        result = await ml_service.process_batch_images(
            image_paths=saved_files,
            return_visualizations=return_visualizations
        )
        
        # Add original filenames to results
        for i, file_result in enumerate(result["results"]):
            if i < len(files):
                file_result["original_filename"] = files[i].filename
        
        return JSONResponse(content=result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch_detect_anomalies: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Cleanup uploaded files
        for file_path in saved_files:
            try:
                if file_path.exists():
                    file_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to cleanup file {file_path}: {e}")

@router.get("/api/v1/model-info")
async def get_model_info(request: Request):
    """
    Get information about the loaded model
    
    Returns:
        JSON response with model information
    """
    ml_service = await get_ml_service(request)
    
    try:
        model_info = ml_service.get_model_info()
        return JSONResponse(content=model_info)
        
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/v1/health")
async def health_check_detailed(request: Request):
    """
    Detailed health check endpoint
    
    Returns:
        JSON response with detailed health information
    """
    try:
        ml_service = getattr(request.app.state, 'ml_service', None)
        
        if not ml_service:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "message": "ML service not initialized",
                    "model_loaded": False
                }
            )
        
        is_ready = ml_service.is_ready()
        model_info = ml_service.get_model_info() if is_ready else {}
        
        status_code = 200 if is_ready else 503
        
        return JSONResponse(
            status_code=status_code,
            content={
                "status": "healthy" if is_ready else "degraded",
                "model_loaded": is_ready,
                "model_info": model_info,
                "uptime": "running"
            }
        )
        
    except Exception as e:
        logger.error(f"Error in health check: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "message": str(e),
                "model_loaded": False
            }
        )

@router.get("/api/v1/stats")
async def get_statistics():
    """
    Get API usage statistics
    
    Returns:
        JSON response with API statistics
    """
    try:
        # This would typically come from a database or metrics store
        # For now, return basic stats
        return JSONResponse(content={
            "total_requests": "N/A",
            "successful_detections": "N/A", 
            "failed_detections": "N/A",
            "average_processing_time": "1.2s",
            "uptime": "running"
        })
        
    except Exception as e:
        logger.error(f"Error getting statistics: {e}")
        raise HTTPException(status_code=500, detail=str(e))