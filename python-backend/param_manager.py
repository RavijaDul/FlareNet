#!/usr/bin/env python3
"""
Parameter Management Script
Provides reset functionality and visualization for adaptive parameters
"""

import argparse
import sys
import os

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from parameter_tracker import parameter_tracker
from adaptive_params import adaptive_params

def reset_parameters():
    """Reset parameters to default values"""
    print("🔄 Resetting parameters to default values...")
    
    # Store current parameters before reset
    current_params = adaptive_params.current_params.copy()
    
    # Reset
    new_params = adaptive_params.reset_to_defaults()
    
    print("✅ Parameters successfully reset!")
    print(f"📊 Previous threshold: {current_params.get('percent_threshold')}")
    print(f"📊 New threshold: {new_params.get('percent_threshold')}")
    print(f"📊 Previous min_area_factor: {current_params.get('min_area_factor')}")
    print(f"📊 New min_area_factor: {new_params.get('min_area_factor')}")
    
    return new_params

def show_current_parameters():
    """Display current parameter values"""
    print("📋 Current Adaptive Parameters:")
    print("=" * 50)
    
    params = adaptive_params.current_params
    
    print(f"Detection Sensitivity:")
    print(f"  - Threshold: {params['percent_threshold']}")
    print(f"  - Min Area Factor: {params['min_area_factor']}")
    
    print(f"\nHSV Thresholds:")
    hsv = params['hsv_warm_thresholds']
    for key, value in hsv.items():
        print(f"  - {key}: {value}")
    
    print(f"\nColor Classification:")
    color = params['color_classification']
    for key, value in color.items():
        print(f"  - {key}: {value}")
        
    print(f"\nGeometric Rules:")
    geo = params['geometric_rules']
    for key, value in geo.items():
        print(f"  - {key}: {value}")

def create_visualization():
    """Create parameter trend visualization"""
    print("📊 Creating parameter visualization...")
    try:
        parameter_tracker.create_visualization()
        print("✅ Visualization created successfully!")
    except Exception as e:
        print(f"❌ Error creating visualization: {e}")

def show_tracking_stats():
    """Show parameter tracking statistics"""
    import json
    import os
    
    json_file = os.path.join(parameter_tracker.tracking_dir, "parameter_changes.json")
    
    if not os.path.exists(json_file):
        print("📊 No parameter changes tracked yet.")
        return
    
    try:
        with open(json_file, 'r') as f:
            records = json.load(f)
        
        print(f"📊 Parameter Tracking Statistics:")
        print("=" * 50)
        print(f"Total changes tracked: {len(records)}")
        
        if records:
            feedback_types = {}
            for record in records:
                for fb_type in record.get("feedback_types", []):
                    feedback_types[fb_type] = feedback_types.get(fb_type, 0) + 1
            
            print(f"Feedback types:")
            for fb_type, count in feedback_types.items():
                print(f"  - {fb_type}: {count}")
            
            latest = records[-1]
            print(f"Latest change: {latest['timestamp']}")
            print(f"Latest image: {latest['image_id']}")
            
        print(f"\n📁 Files created:")
        if os.path.exists(json_file):
            print(f"  - {json_file}")
        
        csv_file = os.path.join(parameter_tracker.tracking_dir, "parameter_changes.csv")
        if os.path.exists(csv_file):
            print(f"  - {csv_file}")
            
        plot_file = os.path.join(parameter_tracker.tracking_dir, "parameter_trends.png")
        if os.path.exists(plot_file):
            print(f"  - {plot_file}")
            
    except Exception as e:
        print(f"❌ Error reading tracking stats: {e}")

def main():
    parser = argparse.ArgumentParser(description="FlareNet Parameter Management")
    
    parser.add_argument("--reset", action="store_true", 
                       help="Reset parameters to default values")
    parser.add_argument("--show", action="store_true",
                       help="Show current parameter values") 
    parser.add_argument("--visualize", action="store_true",
                       help="Create parameter trend visualization")
    parser.add_argument("--stats", action="store_true",
                       help="Show parameter tracking statistics")
    
    args = parser.parse_args()
    
    if not any(vars(args).values()):
        # No arguments provided, show help
        parser.print_help()
        return
    
    if args.reset:
        reset_parameters()
    
    if args.show:
        show_current_parameters()
    
    if args.visualize:
        create_visualization()
        
    if args.stats:
        show_tracking_stats()

if __name__ == "__main__":
    main()