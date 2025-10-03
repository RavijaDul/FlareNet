import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

def generate_unique_id() -> str:
    """Generate a unique identifier"""
    return str(uuid.uuid4())[:8]

def cleanup_old_files(directory: Path, max_age_hours: int = 24):
    """Clean up old files in a directory"""
    try:
        import time
        current_time = time.time()
        cutoff_time = current_time - (max_age_hours * 3600)
        
        for file_path in directory.rglob("*"):
            if file_path.is_file():
                file_age = file_path.stat().st_mtime
                if file_age < cutoff_time:
                    try:
                        file_path.unlink()
                        logger.debug(f"Cleaned up old file: {file_path}")
                    except Exception as e:
                        logger.warning(f"Failed to cleanup {file_path}: {e}")
                        
    except Exception as e:
        logger.error(f"Error during cleanup: {e}")

def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format"""
    if size_bytes == 0:
        return "0B"
    
    size_names = ["B", "KB", "MB", "GB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    
    return f"{size_bytes:.1f}{size_names[i]}"

def validate_image_dimensions(width: int, height: int) -> bool:
    """Validate image dimensions are reasonable"""
    min_size = 32
    max_size = 4096
    
    return (min_size <= width <= max_size and 
            min_size <= height <= max_size)

def copy_model_files(source_dir: Path, target_dir: Path) -> bool:
    """Copy model files from source to target directory"""
    try:
        # Files to copy
        files_to_copy = [
            "results/Patchcore/transformers/v1/weights/lightning/model.ckpt",
            "configs/patchcore_transformers.yaml"
        ]
        
        success = True
        for file_path in files_to_copy:
            source_file = source_dir / file_path
            
            if source_file.exists():
                if "model.ckpt" in file_path:
                    target_file = target_dir / "models" / "weights" / "model.ckpt"
                elif "patchcore_transformers.yaml" in file_path:
                    target_file = target_dir / "configs" / "patchcore_config.yaml"
                else:
                    continue
                
                # Create target directory
                target_file.parent.mkdir(parents=True, exist_ok=True)
                
                # Copy file
                shutil.copy2(source_file, target_file)
                logger.info(f"Copied {source_file} -> {target_file}")
            else:
                logger.warning(f"Source file not found: {source_file}")
                success = False
        
        return success
        
    except Exception as e:
        logger.error(f"Error copying model files: {e}")
        return False

def create_response_dict(
    success: bool = True,
    message: str = "",
    data: Optional[Dict] = None,
    error: Optional[str] = None
) -> Dict:
    """Create standardized API response dictionary"""
    response = {
        "success": success,
        "timestamp": str(Path().cwd()),  # Simple timestamp
    }
    
    if message:
        response["message"] = message
    
    if data:
        response["data"] = data
    
    if error:
        response["error"] = error
    
    return response

def get_system_info() -> Dict:
    """Get basic system information"""
    try:
        import psutil
        import torch
        
        return {
            "cpu_count": os.cpu_count(),
            "memory_total": f"{psutil.virtual_memory().total // (1024**3)}GB",
            "memory_available": f"{psutil.virtual_memory().available // (1024**3)}GB",
            "disk_free": f"{psutil.disk_usage('/').free // (1024**3)}GB",
            "torch_version": torch.__version__,
            "cuda_available": torch.cuda.is_available(),
            "cuda_version": torch.version.cuda if torch.cuda.is_available() else None
        }
    except ImportError:
        return {
            "cpu_count": os.cpu_count(),
            "note": "Install psutil for detailed system info"
        }

def log_performance_metrics(
    operation: str,
    duration: float,
    additional_info: Optional[Dict] = None
):
    """Log performance metrics"""
    info = additional_info or {}
    logger.info(
        f"Performance: {operation} completed in {duration:.2f}s - {info}"
    )