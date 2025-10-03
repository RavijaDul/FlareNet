import torch
import numpy as np
from PIL import Image, ImageDraw
import cv2
import asyncio
import logging
from pathlib import Path
from typing import Tuple, Optional
import torchvision.transforms as transforms

from config import STORAGE_CONFIG

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Image processing utilities for ML inference"""
    
    def __init__(self):
        # Standard ImageNet normalization for PatchCore
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406], 
                std=[0.229, 0.224, 0.225]
            )
        ])
        
    def preprocess_image(self, image_path: Path) -> Tuple[torch.Tensor, Image.Image]:
        """
        Preprocess image for model inference
        
        Args:
            image_path: Path to input image
            
        Returns:
            Tuple of (preprocessed_tensor, original_image)
        """
        try:
            # Load image
            original_image = Image.open(image_path).convert('RGB')
            
            # Apply transforms
            image_tensor = self.transform(original_image)
            
            # Add batch dimension
            image_tensor = image_tensor.unsqueeze(0)
            
            return image_tensor, original_image
            
        except Exception as e:
            logger.error(f"Error preprocessing image {image_path}: {e}")
            raise e
    
    async def generate_mask(self, anomaly_map: np.ndarray, image_id: str) -> Optional[Path]:
        """Generate anomaly mask image"""
        try:
            # Normalize anomaly map to 0-255
            normalized_map = self._normalize_anomaly_map(anomaly_map)
            
            # Convert to PIL Image
            mask_image = Image.fromarray(normalized_map.astype(np.uint8), mode='L')
            
            # Save mask
            mask_path = STORAGE_CONFIG["output_dir"] / "masks" / f"{image_id}_mask.png"
            mask_image.save(mask_path)
            
            logger.debug(f"Generated mask: {mask_path}")
            return mask_path
            
        except Exception as e:
            logger.error(f"Error generating mask: {e}")
            return None
    
    async def generate_overlay(
        self, 
        original_image: Image.Image, 
        anomaly_map: np.ndarray, 
        image_id: str
    ) -> Optional[Path]:
        """Generate overlay of original image with anomaly heatmap"""
        try:
            # Normalize anomaly map
            normalized_map = self._normalize_anomaly_map(anomaly_map)
            
            # Resize anomaly map to match original image size
            resized_map = cv2.resize(
                normalized_map, 
                original_image.size, 
                interpolation=cv2.INTER_LINEAR
            )
            
            # Apply colormap to anomaly map
            heatmap = cv2.applyColorMap(resized_map.astype(np.uint8), cv2.COLORMAP_JET)
            heatmap_rgb = cv2.cvtColor(heatmap, cv2.COLOR_BGR2RGB)
            
            # Convert original image to numpy array
            original_np = np.array(original_image)
            
            # Blend original image with heatmap
            alpha = 0.6  # Transparency factor
            overlay_np = cv2.addWeighted(original_np, alpha, heatmap_rgb, 1-alpha, 0)
            
            # Convert back to PIL Image
            overlay_image = Image.fromarray(overlay_np)
            
            # Save overlay
            overlay_path = STORAGE_CONFIG["output_dir"] / "overlays" / f"{image_id}_overlay.png"
            overlay_image.save(overlay_path)
            
            logger.debug(f"Generated overlay: {overlay_path}")
            return overlay_path
            
        except Exception as e:
            logger.error(f"Error generating overlay: {e}")
            return None
    
    async def generate_filtered_image(
        self, 
        original_image: Image.Image, 
        anomaly_map: np.ndarray, 
        image_id: str,
        threshold: float = 0.5
    ) -> Optional[Path]:
        """Generate filtered image showing only anomalous regions"""
        try:
            # Normalize anomaly map
            normalized_map = self._normalize_anomaly_map(anomaly_map)
            
            # Resize to match original image
            resized_map = cv2.resize(
                normalized_map, 
                original_image.size, 
                interpolation=cv2.INTER_LINEAR
            )
            
            # Create binary mask based on threshold
            binary_mask = (resized_map / 255.0) > threshold
            
            # Apply mask to original image
            original_np = np.array(original_image)
            filtered_np = np.zeros_like(original_np)
            
            # Apply mask to each channel
            for i in range(3):  # RGB channels
                filtered_np[:, :, i] = original_np[:, :, i] * binary_mask
            
            # Convert to PIL Image
            filtered_image = Image.fromarray(filtered_np)
            
            # Save filtered image
            filtered_path = STORAGE_CONFIG["output_dir"] / "filtered" / f"{image_id}_filtered.png"
            filtered_image.save(filtered_path)
            
            logger.debug(f"Generated filtered image: {filtered_path}")
            return filtered_path
            
        except Exception as e:
            logger.error(f"Error generating filtered image: {e}")
            return None
    
    async def generate_bounded_image(
        self, 
        original_image: Image.Image, 
        bounding_boxes: list, 
        image_id: str
    ) -> Optional[Path]:
        """Generate image with bounding boxes around anomalies"""
        try:
            # Create a copy for drawing
            bounded_image = original_image.copy()
            draw = ImageDraw.Draw(bounded_image)
            
            # Draw bounding boxes
            for bbox in bounding_boxes:
                x, y, width, height = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
                confidence = bbox.get("confidence", 0.0)
                bbox_type = bbox.get("type", "Unknown")
                
                # Define colors based on type
                color_map = {
                    "Critical": "red",
                    "Major": "orange", 
                    "Minor": "yellow",
                    "Potential": "blue"
                }
                color = color_map.get(bbox_type, "red")
                
                # Draw rectangle
                draw.rectangle(
                    [x, y, x + width, y + height], 
                    outline=color, 
                    width=3
                )
                
                # Add label
                label = f"{bbox_type}: {confidence:.2f}"
                draw.text((x, y - 20), label, fill=color)
            
            # Save bounded image
            bounded_path = STORAGE_CONFIG["output_dir"] / "bounded" / f"{image_id}_bounded.png"
            bounded_image.save(bounded_path)
            
            logger.debug(f"Generated bounded image: {bounded_path}")
            return bounded_path
            
        except Exception as e:
            logger.error(f"Error generating bounded image: {e}")
            return None
    
    def _normalize_anomaly_map(self, anomaly_map: np.ndarray) -> np.ndarray:
        """Normalize anomaly map to 0-255 range"""
        # Ensure 2D array
        if anomaly_map.ndim > 2:
            anomaly_map = np.squeeze(anomaly_map)
            if anomaly_map.ndim > 2:
                anomaly_map = anomaly_map[0]
        
        # Normalize to 0-255
        min_val = anomaly_map.min()
        max_val = anomaly_map.max()
        
        if max_val > min_val:
            normalized = 255 * (anomaly_map - min_val) / (max_val - min_val)
        else:
            normalized = np.zeros_like(anomaly_map)
        
        return normalized
    
    def validate_image(self, image_path: Path) -> bool:
        """Validate if image can be processed"""
        try:
            if not image_path.exists():
                return False
            
            if image_path.suffix.lower() not in STORAGE_CONFIG["allowed_extensions"]:
                return False
            
            if image_path.stat().st_size > STORAGE_CONFIG["max_file_size"]:
                return False
            
            # Try to open image
            with Image.open(image_path) as img:
                img.verify()
            
            return True
            
        except Exception as e:
            logger.error(f"Image validation failed for {image_path}: {e}")
            return False