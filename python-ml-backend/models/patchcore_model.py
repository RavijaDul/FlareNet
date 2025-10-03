import torch
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
import logging
from omegaconf import OmegaConf

from anomalib.models import Patchcore
from anomalib.data import Folder

logger = logging.getLogger(__name__)

class PatchcoreModel:
    """Wrapper class for PatchCore anomaly detection model"""
    
    def __init__(self, checkpoint_path: Path, config_path: Path, device: str = "auto"):
        self.checkpoint_path = checkpoint_path
        self.config_path = config_path
        self.device = self._get_device(device)
        self.model = None
        self.config = None
        self.is_loaded = False
        
    def _get_device(self, device: str) -> torch.device:
        """Get the appropriate device for inference"""
        if device == "auto":
            return torch.device("cuda" if torch.cuda.is_available() else "cpu")
        return torch.device(device)
    
    async def load_model(self) -> bool:
        """Load the PatchCore model from checkpoint"""
        try:
            logger.info(f"Loading model from {self.checkpoint_path}")
            
            # Load configuration
            if self.config_path.exists():
                self.config = OmegaConf.load(self.config_path)
                logger.info("Configuration loaded successfully")
            else:
                logger.warning(f"Config file not found: {self.config_path}")
                self.config = self._get_default_config()
            
            # Load model
            if not self.checkpoint_path.exists():
                raise FileNotFoundError(f"Model checkpoint not found: {self.checkpoint_path}")
            
            # Load model with config parameters
            if self.config and hasattr(self.config, 'model') and hasattr(self.config.model, 'init_args'):
                self.model = Patchcore.load_from_checkpoint(
                    str(self.checkpoint_path), 
                    **self.config.model.init_args
                )
            else:
                # Fallback to default loading
                self.model = Patchcore.load_from_checkpoint(str(self.checkpoint_path))
            
            self.model.eval()
            self.model = self.model.to(self.device)
            
            self.is_loaded = True
            logger.info(f"Model loaded successfully on device: {self.device}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self.is_loaded = False
            return False
    
    def _get_default_config(self) -> OmegaConf:
        """Get default configuration if config file is missing"""
        return OmegaConf.create({
            "model": {
                "init_args": {
                    "backbone": "wide_resnet50_2",
                    "layers": ["layer2", "layer3"],
                    "pre_trained": True,
                    "coreset_sampling_ratio": 0.1,
                    "num_neighbors": 9
                }
            }
        })
    
    async def predict(self, image_tensor: torch.Tensor) -> Tuple[float, Optional[np.ndarray]]:
        """
        Perform anomaly detection on an image tensor
        
        Args:
            image_tensor: Preprocessed image tensor
            
        Returns:
            Tuple of (anomaly_score, anomaly_map)
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded. Call load_model() first.")
        
        try:
            image_tensor = image_tensor.to(self.device)
            
            with torch.no_grad():
                output = self.model(image_tensor)
                
                # Extract anomaly score
                if hasattr(output, 'anomaly_score'):
                    anomaly_score = output.anomaly_score.item()
                elif hasattr(output, 'pred_score'):
                    anomaly_score = output.pred_score.item()
                else:
                    # Fallback for tuple output
                    anomaly_score = output[0].item() if isinstance(output, (tuple, list)) else 0.0
                
                # Extract anomaly map
                anomaly_map = None
                if hasattr(output, 'anomaly_map'):
                    anomaly_map = output.anomaly_map.squeeze().cpu().numpy()
                elif isinstance(output, (tuple, list)) and len(output) > 1:
                    anomaly_map = output[1].squeeze().cpu().numpy()
                
                return anomaly_score, anomaly_map
                
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise e
    
    def get_model_info(self) -> dict:
        """Get model information"""
        return {
            "model_type": "PatchCore",
            "device": str(self.device),
            "is_loaded": self.is_loaded,
            "checkpoint_path": str(self.checkpoint_path),
            "config_path": str(self.config_path)
        }
    
    async def cleanup(self):
        """Cleanup model resources"""
        if self.model is not None:
            del self.model
            self.model = None
        
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        self.is_loaded = False
        logger.info("Model cleanup completed")