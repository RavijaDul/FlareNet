"""
Enhanced visualization service that creates thermal overlay images 
with bounding boxes and labels like the original trained model
"""
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import logging
from typing import Dict, List, Tuple, Optional
import colorsys

logger = logging.getLogger(__name__)

class ThermalVisualizationService:
    """Create thermal visualizations like the original trained model"""
    
    def __init__(self):
        # Color palette for thermal visualization (blue to red gradient)
        self.thermal_colormap = cv2.COLORMAP_JET
        
        # Default font (fallback if custom font not available)
        try:
            # Try to load a nice font for labels
            self.font = ImageFont.truetype("arial.ttf", 16)
            self.small_font = ImageFont.truetype("arial.ttf", 12)
        except (OSError, IOError):
            # Fallback to default font
            self.font = ImageFont.load_default()
            self.small_font = ImageFont.load_default()
    
    def create_thermal_overlay_with_boxes(
        self,
        original_image_path: str,
        anomaly_map: np.ndarray,
        bounding_boxes: List[Dict],
        anomaly_score: float,
        output_path: str,
        alpha: float = 0.6
    ) -> str:
        """
        Create thermal overlay image with bounding boxes and labels
        matching the style of the original trained model
        """
        try:
            # Load original image
            original_img = Image.open(original_image_path).convert('RGB')
            original_np = np.array(original_img)
            
            # Create thermal heatmap from anomaly map
            thermal_overlay = self._create_thermal_heatmap(anomaly_map, original_img.size)
            
            # Blend original image with thermal overlay
            thermal_np = np.array(thermal_overlay)
            blended_np = cv2.addWeighted(original_np, 1-alpha, thermal_np, alpha, 0)
            
            # Convert back to PIL for drawing bounding boxes and labels
            result_img = Image.fromarray(blended_np)
            
            # Draw bounding boxes and labels
            result_img = self._draw_bounding_boxes_and_labels(
                result_img, bounding_boxes, anomaly_score
            )
            
            # Save the result
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            result_img.save(output_path)
            
            logger.info(f"Created thermal overlay with bounding boxes: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating thermal overlay: {e}")
            raise
    
    def _create_thermal_heatmap(self, anomaly_map: np.ndarray, target_size: Tuple[int, int]) -> Image.Image:
        """Create thermal-style heatmap from anomaly map"""
        try:
            # Normalize anomaly map to 0-255
            if anomaly_map.max() > anomaly_map.min():
                normalized_map = ((anomaly_map - anomaly_map.min()) / 
                                (anomaly_map.max() - anomaly_map.min()) * 255).astype(np.uint8)
            else:
                normalized_map = np.zeros_like(anomaly_map, dtype=np.uint8)
            
            # Apply thermal colormap (blue to red)
            thermal_colored = cv2.applyColorMap(normalized_map, self.thermal_colormap)
            
            # Convert BGR to RGB
            thermal_rgb = cv2.cvtColor(thermal_colored, cv2.COLOR_BGR2RGB)
            
            # Convert to PIL and resize to match original image
            thermal_img = Image.fromarray(thermal_rgb)
            thermal_img = thermal_img.resize(target_size, Image.BILINEAR)
            
            return thermal_img
            
        except Exception as e:
            logger.error(f"Error creating thermal heatmap: {e}")
            # Return a blank thermal-colored image as fallback
            blank = np.full((target_size[1], target_size[0], 3), [0, 0, 128], dtype=np.uint8)
            return Image.fromarray(blank)
    
    def _draw_bounding_boxes_and_labels(
        self, 
        image: Image.Image, 
        bounding_boxes: List[Dict], 
        anomaly_score: float
    ) -> Image.Image:
        """Draw bounding boxes and labels like the original model"""
        try:
            draw = ImageDraw.Draw(image)
            
            # Colors for different severity levels
            colors = {
                'critical': (255, 0, 0),      # Red
                'high': (255, 165, 0),        # Orange  
                'medium': (255, 255, 0),      # Yellow
                'low': (0, 255, 0)            # Green
            }
            
            for i, box in enumerate(bounding_boxes):
                x1, y1, x2, y2 = box['x1'], box['y1'], box['x2'], box['y2']
                confidence = box.get('confidence', 0.8)
                
                # Determine severity based on confidence and anomaly score
                severity = self._get_severity_level(confidence, anomaly_score)
                color = colors.get(severity, colors['medium'])
                
                # Draw bounding box with thick lines
                box_thickness = 3
                for thickness in range(box_thickness):
                    draw.rectangle([x1-thickness, y1-thickness, x2+thickness, y2+thickness], 
                                 outline=color, width=1)
                
                # Create label text
                label = "Point Overload (Potential)"
                confidence_text = f"{confidence*100:.1f}%"
                
                # Calculate label position (above the box)
                label_bbox = draw.textbbox((0, 0), label, font=self.font)
                label_width = label_bbox[2] - label_bbox[0]
                label_height = label_bbox[3] - label_bbox[1]
                
                # Position label above the box
                label_x = max(0, x1)  # Ensure it doesn't go off-screen
                label_y = max(label_height + 5, y1 - label_height - 5)
                
                # Draw label background rectangle
                bg_x1 = label_x - 2
                bg_y1 = label_y - label_height - 2
                bg_x2 = label_x + label_width + 2
                bg_y2 = label_y + 2
                
                # Semi-transparent background
                draw.rectangle([bg_x1, bg_y1, bg_x2, bg_y2], 
                             fill=(0, 0, 0, 128), outline=color)
                
                # Draw label text
                draw.text((label_x, label_y - label_height), label, 
                         fill=(255, 255, 255), font=self.font)
                
                # Draw confidence text smaller, below main label
                if confidence_text:
                    conf_y = label_y - label_height + label_height + 2
                    draw.text((label_x, conf_y), confidence_text, 
                             fill=(255, 255, 255), font=self.small_font)
            
            return image
            
        except Exception as e:
            logger.error(f"Error drawing bounding boxes: {e}")
            return image
    
    def _get_severity_level(self, confidence: float, anomaly_score: float) -> str:
        """Determine severity level based on confidence and anomaly score"""
        combined_score = (confidence + anomaly_score) / 2
        
        if combined_score >= 0.8:
            return 'critical'
        elif combined_score >= 0.6:
            return 'high'
        elif combined_score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    def create_filtered_anomaly_image(
        self,
        original_image_path: str,
        anomaly_map: np.ndarray,
        threshold: float,
        output_path: str
    ) -> str:
        """Create filtered image showing only anomalous regions"""
        try:
            # Load original image
            original_img = Image.open(original_image_path).convert('RGB')
            original_np = np.array(original_img)
            
            # Resize anomaly map to match original image
            anomaly_resized = cv2.resize(anomaly_map, original_img.size, 
                                       interpolation=cv2.INTER_LINEAR)
            
            # Create binary mask based on threshold
            binary_mask = anomaly_resized > threshold
            
            # Apply mask to original image
            filtered_np = np.zeros_like(original_np)
            filtered_np[binary_mask] = original_np[binary_mask]
            
            # Save filtered image
            filtered_img = Image.fromarray(filtered_np)
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            filtered_img.save(output_path)
            
            logger.info(f"Created filtered anomaly image: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating filtered image: {e}")
            raise
    
    def create_pure_anomaly_mask(
        self,
        anomaly_map: np.ndarray,
        target_size: Tuple[int, int],
        output_path: str
    ) -> str:
        """Create pure anomaly mask visualization"""
        try:
            # Normalize to 0-255
            if anomaly_map.max() > anomaly_map.min():
                normalized = ((anomaly_map - anomaly_map.min()) / 
                            (anomaly_map.max() - anomaly_map.min()) * 255).astype(np.uint8)
            else:
                normalized = np.zeros_like(anomaly_map, dtype=np.uint8)
            
            # Apply thermal colormap for consistency
            colored_mask = cv2.applyColorMap(normalized, self.thermal_colormap)
            colored_mask_rgb = cv2.cvtColor(colored_mask, cv2.COLOR_BGR2RGB)
            
            # Resize and save
            mask_img = Image.fromarray(colored_mask_rgb)
            mask_img = mask_img.resize(target_size, Image.BILINEAR)
            
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            mask_img.save(output_path)
            
            logger.info(f"Created anomaly mask: {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Error creating anomaly mask: {e}")
            raise