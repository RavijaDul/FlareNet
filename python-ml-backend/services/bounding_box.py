import cv2
import numpy as np
import logging
from typing import List, Dict, Tuple
from config import BBOX_CONFIG

logger = logging.getLogger(__name__)

class BoundingBoxDetector:
    """Detect and generate bounding boxes around anomalous regions"""
    
    def __init__(self):
        self.min_area = BBOX_CONFIG["min_area"]
        self.max_boxes = BBOX_CONFIG["max_boxes"]
        self.confidence_threshold = BBOX_CONFIG["confidence_threshold"]
        self.nms_threshold = BBOX_CONFIG["nms_threshold"]
    
    def detect_bounding_boxes(
        self, 
        anomaly_map: np.ndarray, 
        original_size: Tuple[int, int],
        anomaly_score: float
    ) -> List[Dict]:
        """
        Detect bounding boxes around anomalous regions
        
        Args:
            anomaly_map: 2D anomaly heatmap
            original_size: (width, height) of original image
            anomaly_score: Overall anomaly score
            
        Returns:
            List of bounding box dictionaries
        """
        try:
            # Ensure 2D array
            if anomaly_map.ndim > 2:
                anomaly_map = np.squeeze(anomaly_map)
                if anomaly_map.ndim > 2:
                    anomaly_map = anomaly_map[0]
            
            # Resize anomaly map to original image size
            resized_map = cv2.resize(
                anomaly_map, 
                original_size, 
                interpolation=cv2.INTER_LINEAR
            )
            
            # Normalize to 0-255
            normalized_map = self._normalize_map(resized_map)
            
            # Apply threshold to create binary mask
            threshold_value = int(255 * self.confidence_threshold)
            _, binary_mask = cv2.threshold(
                normalized_map, 
                threshold_value, 
                255, 
                cv2.THRESH_BINARY
            )
            
            # Find contours
            contours, _ = cv2.findContours(
                binary_mask, 
                cv2.RETR_EXTERNAL, 
                cv2.CHAIN_APPROX_SIMPLE
            )
            
            # Generate bounding boxes from contours
            bounding_boxes = self._generate_boxes_from_contours(
                contours, 
                normalized_map, 
                anomaly_score
            )
            
            # Apply non-maximum suppression if too many boxes
            if len(bounding_boxes) > self.max_boxes:
                bounding_boxes = self._apply_nms(bounding_boxes)
            
            logger.debug(f"Detected {len(bounding_boxes)} bounding boxes")
            return bounding_boxes
            
        except Exception as e:
            logger.error(f"Error detecting bounding boxes: {e}")
            return []
    
    def _normalize_map(self, anomaly_map: np.ndarray) -> np.ndarray:
        """Normalize anomaly map to 0-255"""
        min_val = anomaly_map.min()
        max_val = anomaly_map.max()
        
        if max_val > min_val:
            normalized = 255 * (anomaly_map - min_val) / (max_val - min_val)
        else:
            normalized = np.zeros_like(anomaly_map)
        
        return normalized.astype(np.uint8)
    
    def _generate_boxes_from_contours(
        self, 
        contours: List, 
        normalized_map: np.ndarray, 
        anomaly_score: float
    ) -> List[Dict]:
        """Generate bounding box data from contours"""
        bounding_boxes = []
        
        for contour in contours:
            # Get bounding rectangle
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by minimum area
            if w * h < self.min_area:
                continue
            
            # Calculate confidence based on pixel intensities in the region
            roi = normalized_map[y:y+h, x:x+w]
            region_confidence = np.mean(roi) / 255.0
            
            # Classify anomaly type based on confidence and score
            anomaly_type = self._classify_anomaly_type(
                region_confidence, 
                anomaly_score
            )
            
            bounding_box = {
                "x": int(x),
                "y": int(y), 
                "width": int(w),
                "height": int(h),
                "confidence": round(region_confidence, 3),
                "type": anomaly_type,
                "area": int(w * h)
            }
            
            bounding_boxes.append(bounding_box)
        
        # Sort by confidence (descending)
        bounding_boxes.sort(key=lambda x: x["confidence"], reverse=True)
        
        return bounding_boxes[:self.max_boxes]
    
    def _classify_anomaly_type(self, confidence: float, anomaly_score: float) -> str:
        """Classify the type of anomaly based on confidence and score"""
        # Combine local confidence with global anomaly score
        combined_score = (confidence + anomaly_score) / 2
        
        if combined_score >= 0.8:
            return "Critical"
        elif combined_score >= 0.6:
            return "Major"
        elif combined_score >= 0.4:
            return "Minor"
        else:
            return "Potential"
    
    def _apply_nms(self, bounding_boxes: List[Dict]) -> List[Dict]:
        """Apply Non-Maximum Suppression to reduce overlapping boxes"""
        if len(bounding_boxes) <= self.max_boxes:
            return bounding_boxes
        
        # Convert to format needed for NMS
        boxes = np.array([
            [bbox["x"], bbox["y"], 
             bbox["x"] + bbox["width"], 
             bbox["y"] + bbox["height"]]
            for bbox in bounding_boxes
        ])
        
        scores = np.array([bbox["confidence"] for bbox in bounding_boxes])
        
        # Apply NMS
        indices = cv2.dnn.NMSBoxes(
            boxes.tolist(), 
            scores.tolist(), 
            self.confidence_threshold, 
            self.nms_threshold
        )
        
        if len(indices) > 0:
            # Flatten indices if needed (OpenCV version differences)
            if isinstance(indices, np.ndarray) and indices.ndim > 1:
                indices = indices.flatten()
            
            # Select boxes based on NMS results
            selected_boxes = [bounding_boxes[i] for i in indices[:self.max_boxes]]
            return selected_boxes
        
        return bounding_boxes[:self.max_boxes]
    
    def visualize_boxes_on_map(
        self, 
        anomaly_map: np.ndarray, 
        bounding_boxes: List[Dict]
    ) -> np.ndarray:
        """Draw bounding boxes on anomaly map for debugging"""
        try:
            # Convert to 3-channel image for color drawing
            if anomaly_map.ndim == 2:
                vis_map = cv2.cvtColor(anomaly_map, cv2.COLOR_GRAY2BGR)
            else:
                vis_map = anomaly_map.copy()
            
            # Color map for different types
            color_map = {
                "Critical": (0, 0, 255),    # Red
                "Major": (0, 165, 255),     # Orange
                "Minor": (0, 255, 255),     # Yellow
                "Potential": (255, 0, 0)    # Blue
            }
            
            # Draw each bounding box
            for bbox in bounding_boxes:
                x, y, w, h = bbox["x"], bbox["y"], bbox["width"], bbox["height"]
                bbox_type = bbox.get("type", "Potential")
                confidence = bbox.get("confidence", 0.0)
                
                color = color_map.get(bbox_type, (255, 255, 255))  # White default
                
                # Draw rectangle
                cv2.rectangle(vis_map, (x, y), (x + w, y + h), color, 2)
                
                # Add label
                label = f"{bbox_type}: {confidence:.2f}"
                cv2.putText(
                    vis_map, 
                    label, 
                    (x, y - 10), 
                    cv2.FONT_HERSHEY_SIMPLEX, 
                    0.5, 
                    color, 
                    1
                )
            
            return vis_map
            
        except Exception as e:
            logger.error(f"Error visualizing bounding boxes: {e}")
            return anomaly_map