"""
Parameter Tracker - Logs parameter changes with before/after states
Provides JSON/CSV logging, visualization, and reset functionality
"""

import json
import csv
import os
from datetime import datetime
import matplotlib.pyplot as plt
import pandas as pd
from typing import Dict, List, Any

class ParameterTracker:
    def __init__(self, base_dir: str = "."):
        self.base_dir = base_dir
        self.tracking_dir = os.path.join(base_dir, "parameter_tracking")
        self.ensure_tracking_directory()
        
    def ensure_tracking_directory(self):
        """Create tracking directory if it doesn't exist"""
        os.makedirs(self.tracking_dir, exist_ok=True)
        
    def log_parameter_change(self, 
                           image_id: str, 
                           user_id: str, 
                           params_before: Dict, 
                           params_after: Dict, 
                           feedback_type: List[str],
                           detection_counts: Dict):
        """Log parameter changes in both JSON and CSV formats"""
        
        timestamp = datetime.now().isoformat()
        
        # Create change record
        change_record = {
            "timestamp": timestamp,
            "image_id": image_id,
            "user_id": user_id,
            "feedback_types": feedback_type,
            "detection_counts": detection_counts,
            "parameters_before": params_before.copy(),
            "parameters_after": params_after.copy(),
            "changes": self._calculate_changes(params_before, params_after)
        }
        
        # Save as JSON
        self._save_json_log(change_record)
        
        # Save to CSV
        self._save_csv_log(change_record)
        
        # Print formatted output
        self._print_parameter_change(change_record)
        
        return change_record
    
    def _calculate_changes(self, before: Dict, after: Dict) -> Dict:
        """Calculate parameter changes"""
        changes = {}
        for key in before:
            if key in after and before[key] != after[key]:
                changes[key] = {
                    "from": before[key],
                    "to": after[key],
                    "delta": after[key] - before[key] if isinstance(before[key], (int, float)) else None
                }
        return changes
    
    def _save_json_log(self, record: Dict):
        """Save record to JSON log file"""
        json_file = os.path.join(self.tracking_dir, "parameter_changes.json")
        
        # Load existing records
        records = []
        if os.path.exists(json_file):
            try:
                with open(json_file, 'r') as f:
                    records = json.load(f)
            except:
                records = []
        
        # Add new record
        records.append(record)
        
        # Save updated records
        with open(json_file, 'w') as f:
            json.dump(records, f, indent=2)
    
    def _save_csv_log(self, record: Dict):
        """Save record to CSV file"""
        csv_file = os.path.join(self.tracking_dir, "parameter_changes.csv")
        
        # Flatten record for CSV
        flat_record = {
            "timestamp": record["timestamp"],
            "image_id": record["image_id"], 
            "user_id": record["user_id"],
            "feedback_types": ",".join(record["feedback_types"]),
            "original_detections": record["detection_counts"].get("original", 0),
            "corrected_detections": record["detection_counts"].get("corrected", 0),
            "added_detections": record["detection_counts"].get("added", 0),
        }
        
        # Add parameter values
        for param, value in record["parameters_before"].items():
            flat_record[f"before_{param}"] = value
            
        for param, value in record["parameters_after"].items():
            flat_record[f"after_{param}"] = value
            
        # Add changes
        for param, change_info in record["changes"].items():
            if change_info["delta"] is not None:
                flat_record[f"delta_{param}"] = change_info["delta"]
        
        # Write to CSV
        file_exists = os.path.exists(csv_file)
        with open(csv_file, 'a', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=flat_record.keys())
            if not file_exists:
                writer.writeheader()
            writer.writerow(flat_record)
    
    def _print_parameter_change(self, record: Dict):
        """Print formatted parameter change summary"""
        print("\n" + "="*60)
        print(" PARAMETER CHANGE TRACKING")
        print("="*60)
        print(f" Timestamp: {record['timestamp']}")
        print(f"  Image ID: {record['image_id']}")
        print(f" User ID: {record['user_id']}")
        print(f" Feedback Types: {', '.join(record['feedback_types'])}")
        
        print(f"\n Detection Counts:")
        counts = record['detection_counts']
        print(f"   Original: {counts.get('original', 0)}")
        print(f"   Corrected: {counts.get('corrected', 0)}")
        print(f"   Added: {counts.get('added', 0)}")
        
        print(f"\n  Parameter Changes:")
        for param, change in record['changes'].items():
            delta_str = f" (Δ: {change['delta']:+.4f})" if change['delta'] is not None else ""
            print(f"   {param}: {change['from']} → {change['to']}{delta_str}")
        
        print("="*60 + "\n")
    
    def create_visualization(self):
        """Create parameter change visualization"""
        json_file = os.path.join(self.tracking_dir, "parameter_changes.json")
        
        if not os.path.exists(json_file):
            print("No parameter changes to visualize yet.")
            return
            
        try:
            with open(json_file, 'r') as f:
                records = json.load(f)
                
            if not records:
                print("No parameter changes to visualize yet.")
                return
                
            # Create visualization
            self._plot_parameter_trends(records)
            
        except Exception as e:
            print(f"Error creating visualization: {e}")
    
    def _plot_parameter_trends(self, records: List[Dict]):
        """Plot parameter trends over time"""
        df_list = []
        
        for record in records:
            row = {
                'timestamp': datetime.fromisoformat(record['timestamp']),
                'image_id': record['image_id'],
                'feedback_types': ','.join(record['feedback_types'])
            }
            
            # Add parameter values
            for param, value in record['parameters_after'].items():
                row[param] = value
                
            df_list.append(row)
        
        if not df_list:
            return
            
        df = pd.DataFrame(df_list)
        
        # Create subplots for each parameter
        param_columns = [col for col in df.columns if col not in ['timestamp', 'image_id', 'feedback_types']]
        
        fig, axes = plt.subplots(len(param_columns), 1, figsize=(12, 3*len(param_columns)))
        if len(param_columns) == 1:
            axes = [axes]
            
        for i, param in enumerate(param_columns):
            axes[i].plot(df['timestamp'], df[param], marker='o', linewidth=2, markersize=6)
            axes[i].set_title(f'Parameter: {param}')
            axes[i].set_ylabel('Value')
            axes[i].grid(True, alpha=0.3)
            
            # Add annotations for feedback types
            for j, row in df.iterrows():
                if row['feedback_types']:
                    axes[i].annotate(row['feedback_types'], 
                                   (row['timestamp'], row[param]),
                                   xytext=(5, 5), textcoords='offset points',
                                   fontsize=8, alpha=0.7)
        
        plt.xlabel('Time')
        plt.tight_layout()
        
        # Save plot
        plot_file = os.path.join(self.tracking_dir, "parameter_trends.png")
        plt.savefig(plot_file, dpi=300, bbox_inches='tight')
        plt.show()
        
        print(f"📊 Visualization saved to: {plot_file}")
    
    def reset_to_defaults(self):
        """Reset parameters to default values"""
        from adaptive_params import adaptive_params
        
        # Store current params before reset
        current_params = adaptive_params.current_params.copy()
        
        # Reset to defaults
        adaptive_params.reset_to_defaults()
        
        # Log the reset
        reset_record = {
            "timestamp": datetime.now().isoformat(),
            "action": "RESET_TO_DEFAULTS",
            "parameters_before": current_params,
            "parameters_after": adaptive_params.current_params.copy()
        }
        
        # Save reset log
        reset_file = os.path.join(self.tracking_dir, "reset_log.json")
        reset_logs = []
        if os.path.exists(reset_file):
            try:
                with open(reset_file, 'r') as f:
                    reset_logs = json.load(f)
            except:
                reset_logs = []
        
        reset_logs.append(reset_record)
        
        with open(reset_file, 'w') as f:
            json.dump(reset_logs, f, indent=2)
        
        print("🔄 Parameters reset to defaults!")
        print(f"📝 Reset logged to: {reset_file}")
        
        return adaptive_params.current_params

# Global tracker instance
parameter_tracker = ParameterTracker()