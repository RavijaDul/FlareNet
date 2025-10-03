import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.absolute()

# Model configuration
MODEL_CONFIG = {
    "checkpoint_path": BASE_DIR / "models" / "weights" / "model.ckpt",
    "config_path": BASE_DIR / "configs" / "patchcore_config.yaml",
    "device": "auto",  # "auto", "cpu", or "cuda"
    "batch_size": 1,
}

# API configuration
API_CONFIG = {
    "title": "FlareNet ML Backend",
    "description": "PatchCore-based anomaly detection for thermal transformer images",
    "version": "1.0.0",
    "host": "0.0.0.0",
    "port": 8001,
    "debug": True,
}

# CORS settings
CORS_CONFIG = {
    "allow_origins": [
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8080",  # Java Spring Boot
    ],
    "allow_credentials": True,
    "allow_methods": ["*"],
    "allow_headers": ["*"],
}

# File storage configuration
STORAGE_CONFIG = {
    "upload_dir": BASE_DIR / "uploads",
    "output_dir": BASE_DIR / "outputs",
    "max_file_size": 10 * 1024 * 1024,  # 10MB
    "allowed_extensions": {".jpg", ".jpeg", ".png"},
}

# Classification thresholds
CLASSIFICATION_CONFIG = {
    "normal_threshold": 0.3,
    "potential_threshold": 0.5,
    "overloway_threshold": 0.8,
    "faulty_threshold": 1.0,
}

# Bounding box configuration
BBOX_CONFIG = {
    "min_area": 100,  # Minimum bounding box area
    "max_boxes": 10,  # Maximum number of bounding boxes
    "confidence_threshold": 0.5,
    "nms_threshold": 0.3,  # Non-maximum suppression
}

# Logging configuration
LOGGING_CONFIG = {
    "level": os.getenv("LOG_LEVEL", "INFO"),
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": BASE_DIR / "logs" / "ml_backend.log",
}

# Create necessary directories
for config in [STORAGE_CONFIG, LOGGING_CONFIG]:
    for key, path in config.items():
        if key.endswith("_dir") or key == "file":
            if isinstance(path, Path):
                path.parent.mkdir(parents=True, exist_ok=True)
                if key.endswith("_dir"):
                    path.mkdir(parents=True, exist_ok=True)

# Create output subdirectories
output_subdirs = ["masks", "overlays", "filtered", "bounded"]
for subdir in output_subdirs:
    (STORAGE_CONFIG["output_dir"] / subdir).mkdir(parents=True, exist_ok=True)