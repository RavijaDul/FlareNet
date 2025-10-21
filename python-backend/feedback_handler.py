import json
import os
from datetime import datetime
from typing import Dict, List, Tuple
from adaptive_params import adaptive_params

class FeedbackHandler:
    def __init__(self):
        self.base_dir = os.path.dirname(__file__)
        self.feedback_data_dir = os.path.join(self.base_dir, "feedback_data")
        self.feedback_file = os.path.join(self.feedback_data_dir, "user_corrections.json")
        
        # Ensure feedback_data directory exists
        os.makedirs(self.feedback_data_dir, exist_ok=True)
    
    def process_user_feedback(self, image_id: str, user_id: str, original_detections: List[Dict], user_corrections: List[Dict]):
        """Process user feedback and adapt parameters"""
        
        try:
            print(f" Processing feedback for image {image_id} by user {user_id}")
            print(f" Original: {len(original_detections)}, Corrections: {len(user_corrections)}")
            
            # Analyze the feedback
            feedback_analysis = self._analyze_feedback(original_detections, user_corrections)
            
            print(f" Feedback analysis: {len(feedback_analysis)} items")
            for analysis in feedback_analysis:
                print(f"   - {analysis['type']}")
            
            # Store feedback for logging
            self._store_feedback(image_id, user_id, original_detections, user_corrections, feedback_analysis)
            
            # Store parameters BEFORE adaptation
            params_before = adaptive_params.current_params.copy()
            
            # Adapt parameters based on feedback
            adaptations_applied = []
            for analysis in feedback_analysis:
                adaptive_params.adapt_from_feedback(analysis)
                adaptations_applied.append(analysis["type"])
            
            print(f" Applied adaptations: {adaptations_applied}")
            
            # Track parameter changes if any adaptations were made
            if adaptations_applied:
                # Import here to avoid circular imports
                from parameter_tracker import parameter_tracker
                
                params_after = adaptive_params.current_params.copy()
                detection_counts = {
                    "original": len(original_detections),
                    "corrected": len(user_corrections),
                    "added": len(user_corrections) - len([c for c in user_corrections for o in original_detections if self._detections_match(c, o)]),
                    "deleted": len(original_detections) - len([o for o in original_detections for c in user_corrections if self._detections_match(o, c)])
                }
                
                parameter_tracker.log_parameter_change(
                    image_id=image_id,
                    user_id=user_id, 
                    params_before=params_before,
                    params_after=params_after,
                    feedback_type=adaptations_applied,
                    detection_counts=detection_counts
                )
            
            return {
                "status": "success", 
                "message": f"Processed {len(feedback_analysis)} feedback items",
                "adaptations_applied": adaptations_applied,
                "feedback_count": len(feedback_analysis)
            }
            
        except Exception as e:
            print(f" Feedback processing error: {str(e)}")
            return {
                "status": "error",
                "message": f"Failed to process feedback: {str(e)}",
                "adaptations_applied": [],
                "feedback_count": 0
            }
    
    def _analyze_feedback(self, original: List[Dict], corrected: List[Dict]) -> List[Dict]:
        """Analyze user feedback to determine adaptation strategy"""
        analyses = []
        
        # Create ID mappings for comparison
        orig_by_id = {self._get_detection_id(det, i): det for i, det in enumerate(original)}
        corr_by_id = {self._get_detection_id(det, i): det for i, det in enumerate(corrected)}
        
        # 1. Detect deletions (false positives)
        for orig_id, orig_det in orig_by_id.items():
            if orig_id not in corr_by_id:
                analyses.append({
                    "type": "false_positive",
                    "changes": {
                        "deleted_detection": orig_det,
                        "category": orig_det.get("category", ""),
                        "confidence": orig_det.get("confidence", 0.5)
                    }
                })
        
        # 2. Detect additions (false negatives)
        for corr_id, corr_det in corr_by_id.items():
            if corr_id not in orig_by_id:
                analyses.append({
                    "type": "false_negative", 
                    "changes": {
                        "added_detection": corr_det,
                        "category": corr_det.get("category", ""),
                        "confidence": corr_det.get("confidence", 0.5)
                    }
                })
        
        # 3. Detect modifications
        for corr_id, corr_det in corr_by_id.items():
            if corr_id in orig_by_id:
                orig_det = orig_by_id[corr_id]
                
                # Check for bbox changes
                bbox_changed, bbox_change_info = self._analyze_bbox_change(
                    orig_det.get("bbox", {}), 
                    corr_det.get("bbox", {})
                )
                
                if bbox_changed:
                    analyses.append({
                        "type": "bbox_resize",
                        "changes": {
                            "bbox_change": bbox_change_info,
                            "category": orig_det.get("category", ""),
                            "original_bbox": orig_det.get("bbox", {}),
                            "corrected_bbox": corr_det.get("bbox", {})
                        }
                    })
                
                # Check for severity changes
                if orig_det.get("severity") != corr_det.get("severity"):
                    analyses.append({
                        "type": "severity_change",
                        "changes": {
                            "severity_change": {
                                "from": orig_det.get("severity"),
                                "to": corr_det.get("severity")
                            },
                            "category": orig_det.get("category", ""),
                            "confidence": orig_det.get("confidence", 0.5)
                        }
                    })
                
                # Check for category changes
                if orig_det.get("category") != corr_det.get("category"):
                    analyses.append({
                        "type": "category_change",
                        "changes": {
                            "category_change": {
                                "from": orig_det.get("category"),
                                "to": corr_det.get("category")
                            },
                            "bbox": orig_det.get("bbox", {}),
                            "confidence": orig_det.get("confidence", 0.5)
                        }
                    })
        
        return analyses
    
    def _get_detection_id(self, detection: Dict, index: int) -> str:
        """Generate unique ID for detection matching"""
        bbox = detection.get("bbox", {})
        x = bbox.get("x", 0)
        y = bbox.get("y", 0)
        w = bbox.get("width", 0)
        h = bbox.get("height", 0)
        return f"{x}_{y}_{w}_{h}_{index}"
    
    def _analyze_bbox_change(self, orig_bbox: Dict, corr_bbox: Dict) -> Tuple[bool, Dict]:
        """Analyze bounding box changes"""
        if not orig_bbox or not corr_bbox:
            return False, {}
        
        # Calculate area change
        orig_area = orig_bbox.get("width", 0) * orig_bbox.get("height", 0)
        corr_area = corr_bbox.get("width", 0) * corr_bbox.get("height", 0)
        
        if orig_area == 0:
            return False, {}
        
        area_ratio = corr_area / orig_area
        
        # Consider significant if area changed by more than 20%
        if abs(area_ratio - 1.0) > 0.2:
            return True, {
                "area_ratio": area_ratio,
                "original_area": orig_area,
                "corrected_area": corr_area,
                "size_change": "smaller" if area_ratio < 1.0 else "larger"
            }
        
        # Also check for position changes
        orig_x, orig_y = orig_bbox.get("x", 0), orig_bbox.get("y", 0)
        corr_x, corr_y = corr_bbox.get("x", 0), corr_bbox.get("y", 0)
        
        position_change = abs(orig_x - corr_x) + abs(orig_y - corr_y)
        if position_change > 10:  # Moved by more than 10 pixels
            return True, {
                "area_ratio": area_ratio,
                "original_area": orig_area,
                "corrected_area": corr_area,
                "size_change": "moved",
                "position_change": position_change
            }
        
        return False, {}
    
    def _store_feedback(self, image_id: str, user_id: str, original: List[Dict], 
                       corrected: List[Dict], analysis: List[Dict]):
        """Store feedback data for logging and analysis"""
        feedback_entry = {
            "timestamp": datetime.now().isoformat(),
            "image_id": image_id,
            "user_id": user_id,
            "original_count": len(original),
            "corrected_count": len(corrected),
            "original_detections": original,
            "user_corrections": corrected,
            "feedback_analysis": analysis
        }
        
        try:
            # Load existing feedback
            if os.path.exists(self.feedback_file):
                with open(self.feedback_file, 'r') as f:
                    feedback_data = json.load(f)
            else:
                feedback_data = {"feedback_entries": []}
            
            feedback_data["feedback_entries"].append(feedback_entry)
            
            # Save updated feedback
            with open(self.feedback_file, 'w') as f:
                json.dump(feedback_data, f, indent=2)
                
        except Exception as e:
            print(f"Warning: Could not store feedback: {e}")
    
    def export_feedback_log(self, format_type: str = "json") -> str:
        """Export feedback log for analysis"""
        try:
            if not os.path.exists(self.feedback_file):
                return json.dumps({"feedback_entries": []})
            
            if format_type.lower() == "json":
                with open(self.feedback_file, 'r') as f:
                    return f.read()
            
            elif format_type.lower() == "csv":
                # Convert to CSV format for easier analysis
                if os.path.exists(self.feedback_file):
                    with open(self.feedback_file, 'r') as f:
                        data = json.load(f)
                    
                    csv_lines = ["timestamp,image_id,user_id,original_count,corrected_count,feedback_type"]
                    for entry in data.get("feedback_entries", []):
                        for analysis in entry.get("feedback_analysis", []):
                            csv_lines.append(f"{entry['timestamp']},{entry['image_id']},{entry['user_id']},{entry['original_count']},{entry['corrected_count']},{analysis['type']}")
                    
                    return "\n".join(csv_lines)
            
            return ""
            
        except Exception as e:
            print(f"Warning: Could not export feedback log: {e}")
            return ""
    
    def get_feedback_statistics(self) -> Dict:
        """Get statistics about feedback received"""
        try:
            if not os.path.exists(self.feedback_file):
                return {"total_feedback": 0, "feedback_types": {}}
            
            with open(self.feedback_file, 'r') as f:
                data = json.load(f)
            
            total_feedback = len(data.get("feedback_entries", []))
            feedback_types = {}
            
            for entry in data.get("feedback_entries", []):
                for analysis in entry.get("feedback_analysis", []):
                    feedback_type = analysis["type"]
                    feedback_types[feedback_type] = feedback_types.get(feedback_type, 0) + 1
            
            return {
                "total_feedback": total_feedback,
                "feedback_types": feedback_types,
                "last_feedback": data.get("feedback_entries", [])[-1]["timestamp"] if total_feedback > 0 else None
            }
            
        except Exception as e:
            print(f"Warning: Could not get feedback statistics: {e}")
            return {"total_feedback": 0, "feedback_types": {}}
    
    def _detections_match(self, det1: Dict, det2: Dict) -> bool:
        """Check if two detections match (simple overlap check)"""
        try:
            x1_1, y1_1, x2_1, y2_1 = det1.get("x", 0), det1.get("y", 0), det1.get("x", 0) + det1.get("width", 0), det1.get("y", 0) + det1.get("height", 0)
            x1_2, y1_2, x2_2, y2_2 = det2.get("x", 0), det2.get("y", 0), det2.get("x", 0) + det2.get("width", 0), det2.get("y", 0) + det2.get("height", 0)
            
            # Calculate overlap
            overlap_x = max(0, min(x2_1, x2_2) - max(x1_1, x1_2))
            overlap_y = max(0, min(y2_1, y2_2) - max(y1_1, y1_2))
            overlap_area = overlap_x * overlap_y
            
            area1 = (x2_1 - x1_1) * (y2_1 - y1_1)
            area2 = (x2_2 - x1_2) * (y2_2 - y1_2)
            
            if area1 == 0 or area2 == 0:
                return False
                
            iou = overlap_area / (area1 + area2 - overlap_area)
            return iou > 0.3  # 30% overlap threshold
        except:
            return False

# Global instance for use across modules
feedback_handler = FeedbackHandler()