import json
import os
from typing import Dict, List, Tuple
from datetime import datetime

class AdaptiveParams:
    def __init__(self):
        self.base_dir = os.path.dirname(__file__)
        self.feedback_data_dir = os.path.join(self.base_dir, "feedback_data")
        self.params_file = os.path.join(self.feedback_data_dir, "adaptive_parameters.json")
        
        # Ensure feedback_data directory exists
        os.makedirs(self.feedback_data_dir, exist_ok=True)
        
        # Default OpenCV classification parameters from model_core.py
        self.default_params = {
            # Detection sensitivity
            "percent_threshold": 50,        # Your PERCENT_THRESHOLD
            "min_area_factor": 0.001,       # Your min_area calculation factor
            
            # HSV color thresholds for thermal detection
            "hsv_warm_thresholds": {
                "hue_low": 0.17,           # Your warm_hue <= 0.17
                "hue_high": 0.95,          # Your warm_hue >= 0.95  
                "saturation_min": 0.35,    # Your warm_sat >= 0.35
                "value_min": 0.5           # Your warm_val >= 0.5
            },
            
            # Color classification thresholds (in HSV 0-180, 0-255, 0-255)
            "color_classification": {
                "red_hue_max": 10,         # H <= 10
                "red_hue_min": 160,        # H >= 160
                "orange_hue_min": 10,      # 10 < H <= 25
                "orange_hue_max": 25,
                "yellow_hue_min": 25,      # 25 < H <= 35
                "yellow_hue_max": 35,
                "color_sat_min": 100,      # S >= 100
                "color_val_min": 100       # V >= 100
            },
            
            # Geometric classification rules
            "geometric_rules": {
                "loose_joint_area_min": 0.10,    # area_frac >= 0.10
                "loose_joint_overlap_min": 0.4,   # overlap_frac >= 0.4
                "loose_joint_large_area": 0.30,   # area_frac >= 0.30
                "wire_aspect_ratio": 2.0,         # aspect >= 2.0
                "wire_overload_area": 0.30        # area_frac >= 0.30
            },
            
            # Severity classification rules
            "severity_rules": {
                "faulty_red_orange_threshold": 0.5  # red_orange_frac >= 0.5 → Faulty
            },
            
            # Confidence calculation factors
            "confidence_factors": {
                "loose_joint_base": 0.6,
                "loose_joint_area_factor": 0.8,
                "wire_base": 0.5,
                "wire_aspect_factor": 0.2,
                "point_base": 0.5,
                "point_brightness_factor": 0.5
            }
        }
        
        self.current_params = self.load_params()
    
    def load_params(self) -> Dict:
        """Load adaptive parameters or return defaults"""
        if os.path.exists(self.params_file):
            try:
                with open(self.params_file, 'r') as f:
                    saved_params = json.load(f)
                    # Merge with defaults to handle new parameters
                    merged = self._deep_merge(self.default_params.copy(), saved_params)
                    return merged
            except Exception as e:
                print(f"Warning: Could not load adaptive parameters: {e}")
                
        return self.default_params.copy()
    
    def save_params(self):
        """Save current parameters to file"""
        try:
            with open(self.params_file, 'w') as f:
                json.dump(self.current_params, f, indent=2)
        except Exception as e:
            print(f"Warning: Could not save adaptive parameters: {e}")
    
    def _deep_merge(self, base_dict: Dict, update_dict: Dict) -> Dict:
        """Deep merge two dictionaries"""
        for key, value in update_dict.items():
            if key in base_dict and isinstance(base_dict[key], dict) and isinstance(value, dict):
                self._deep_merge(base_dict[key], value)
            else:
                base_dict[key] = value
        return base_dict
    
    def get_param(self, category: str, param: str = None):
        """Get specific parameter value"""
        if param is None:
            return self.current_params.get(category, {})
        return self.current_params.get(category, {}).get(param, 0)
    
    def update_param(self, category: str, param: str, value):
        """Update specific parameter"""
        if category not in self.current_params:
            self.current_params[category] = {}
        self.current_params[category][param] = value
        self.save_params()
    
    def adapt_from_feedback(self, feedback_analysis: Dict):
        """Adapt parameters based on user feedback analysis"""
        feedback_type = feedback_analysis["type"]
        changes = feedback_analysis["changes"]
        
        if feedback_type == "false_positive":
            self._reduce_sensitivity(changes)
        elif feedback_type == "false_negative":
            self._increase_sensitivity(changes)
        elif feedback_type == "bbox_resize":
            self._adapt_geometric_rules(changes)
        elif feedback_type == "severity_change":
            self._adapt_severity_rules(changes)
        elif feedback_type == "category_change":
            self._adapt_classification_rules(changes)
        
        self.save_params()
    
    def _reduce_sensitivity(self, changes: Dict):
        """Reduce detection sensitivity for false positives"""
        # Increase threshold to be less sensitive
        current_threshold = self.current_params["percent_threshold"]
        self.current_params["percent_threshold"] = min(90, current_threshold + 3)
        
        # Increase minimum area requirement
        current_min_area = self.current_params["min_area_factor"]
        self.current_params["min_area_factor"] = min(0.005, current_min_area * 1.2)
        
        print(f"Reduced sensitivity: threshold {current_threshold} -> {self.current_params['percent_threshold']}")
    
    def _increase_sensitivity(self, changes: Dict):
        """Increase detection sensitivity for false negatives"""
        # Decrease threshold to be more sensitive
        current_threshold = self.current_params["percent_threshold"]
        self.current_params["percent_threshold"] = max(10, current_threshold - 3)
        
        # Decrease minimum area requirement
        current_min_area = self.current_params["min_area_factor"]
        self.current_params["min_area_factor"] = max(0.0005, current_min_area * 0.8)
        
        print(f"Increased sensitivity: threshold {current_threshold} -> {self.current_params['percent_threshold']}")
    
    def _adapt_geometric_rules(self, changes: Dict):
        """Adapt geometric rules based on bbox resize feedback"""
        bbox_change = changes.get("bbox_change", {})
        category = changes.get("category", "")
        
        area_ratio = bbox_change.get("area_ratio", 1.0)  # new_area / original_area
        
        if "loose_joint" in category.lower():
            if area_ratio < 0.8:  # User made box smaller
                # Increase area requirement for loose joint detection
                current_min = self.current_params["geometric_rules"]["loose_joint_area_min"]
                self.current_params["geometric_rules"]["loose_joint_area_min"] = min(0.20, current_min * 1.1)
                print(f"Tightened loose joint area requirement: {current_min:.3f} -> {self.current_params['geometric_rules']['loose_joint_area_min']:.3f}")
            
            elif area_ratio > 1.2:  # User made box larger
                # Decrease area requirement
                current_min = self.current_params["geometric_rules"]["loose_joint_area_min"]
                self.current_params["geometric_rules"]["loose_joint_area_min"] = max(0.05, current_min * 0.9)
                print(f"Relaxed loose joint area requirement: {current_min:.3f} -> {self.current_params['geometric_rules']['loose_joint_area_min']:.3f}")
    
    def _adapt_severity_rules(self, changes: Dict):
        """Adapt severity classification rules"""
        severity_change = changes.get("severity_change", {})
        
        if severity_change.get("from") == "Faulty" and severity_change.get("to") == "Potentially Faulty":
            # User thinks we're too harsh - increase threshold for "Faulty"
            current_threshold = self.current_params["severity_rules"]["faulty_red_orange_threshold"]
            self.current_params["severity_rules"]["faulty_red_orange_threshold"] = min(0.8, current_threshold + 0.05)
            print(f"Made 'Faulty' classification stricter: {current_threshold:.2f} -> {self.current_params['severity_rules']['faulty_red_orange_threshold']:.2f}")
        
        elif severity_change.get("from") == "Potentially Faulty" and severity_change.get("to") == "Faulty":
            # User thinks we're too lenient - decrease threshold for "Faulty"
            current_threshold = self.current_params["severity_rules"]["faulty_red_orange_threshold"]
            self.current_params["severity_rules"]["faulty_red_orange_threshold"] = max(0.2, current_threshold - 0.05)
            print(f"Made 'Faulty' classification looser: {current_threshold:.2f} -> {self.current_params['severity_rules']['faulty_red_orange_threshold']:.2f}")
    
    def _adapt_classification_rules(self, changes: Dict):
        """Adapt category classification rules based on user changes"""
        category_change = changes.get("category_change", {})
        original_category = category_change.get("from", "")
        corrected_category = category_change.get("to", "")
        
        # For now, log the category change for future analysis
        print(f"Category change detected: {original_category} -> {corrected_category}")
        # Could implement specific rule adaptations based on category patterns
    
    def get_current_percent_threshold(self) -> int:
        """Get current percent threshold for use in model_core.py"""
        return self.current_params["percent_threshold"]
    
    def get_current_min_area_factor(self) -> float:
        """Get current minimum area factor for use in model_core.py"""
        return self.current_params["min_area_factor"]

# Global instance for use across modules
adaptive_params = AdaptiveParams()