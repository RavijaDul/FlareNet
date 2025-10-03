import logging
import logging.handlers
from pathlib import Path
from config import LOGGING_CONFIG

def setup_logger():
    """Setup application logging configuration"""
    
    # Create logs directory if it doesn't exist
    log_file = Path(LOGGING_CONFIG["file"])
    log_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=getattr(logging, LOGGING_CONFIG["level"].upper()),
        format=LOGGING_CONFIG["format"],
        handlers=[
            # Console handler
            logging.StreamHandler(),
            # File handler with rotation
            logging.handlers.RotatingFileHandler(
                log_file,
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5
            )
        ]
    )
    
    # Set specific logger levels
    logging.getLogger("uvicorn").setLevel(logging.INFO)
    logging.getLogger("fastapi").setLevel(logging.INFO)
    logging.getLogger("anomalib").setLevel(logging.WARNING)
    logging.getLogger("pytorch_lightning").setLevel(logging.WARNING)
    
    logger = logging.getLogger(__name__)
    logger.info("Logging configuration initialized")
    
    return logger