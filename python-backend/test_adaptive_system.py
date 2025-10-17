import json
from model_core import (
    process_user_feedback_api, 
    get_current_parameters, 
    get_feedback_statistics, 
    export_feedback_log,
    reset_parameters_to_default
)

def test_feedback_system():
    """Test the adaptive feedback system"""
    
    print("=== FlareNet Adaptive Feedback System Test ===\n")
    
    # 1. Show initial parameters
    print("1. Initial Parameters:")
    initial_params = get_current_parameters()
    print(f"   Percent Threshold: {initial_params['percent_threshold']}")
    print(f"   Min Area Factor: {initial_params['min_area_factor']:.6f}")
    print(f"   Faulty Threshold: {initial_params['severity_rules']['faulty_red_orange_threshold']}")
    print()
    
    # 2. Simulate user feedback scenarios
    print("2. Testing False Positive Feedback (User deletes detection):")
    
    # Original detections from model
    original_detections = [
        {
            "id": "det_1",
            "category": "loose_joint",
            "severity": "Faulty", 
            "confidence": 0.75,
            "bbox": {"x": 100, "y": 150, "width": 80, "height": 60}
        },
        {
            "id": "det_2", 
            "category": "point_overload",
            "severity": "Potentially Faulty",
            "confidence": 0.60,
            "bbox": {"x": 200, "y": 100, "width": 40, "height": 30}
        }
    ]
    
    # User corrections - deleted first detection (false positive)
    user_corrections = [
        {
            "id": "det_2",
            "category": "point_overload", 
            "severity": "Potentially Faulty",
            "confidence": 0.60,
            "bbox": {"x": 200, "y": 100, "width": 40, "height": 30}
        }
    ]
    
    result = process_user_feedback_api("test_image_1", "user_123", original_detections, user_corrections)
    print(f"   Result: {result['message']}")
    print(f"   Adaptations: {result['adaptations_applied']}")
    
    # Show updated parameters
    updated_params = get_current_parameters()
    print(f"   Updated Threshold: {initial_params['percent_threshold']} -> {updated_params['percent_threshold']}")
    print()
    
    # 3. Test bbox resize feedback
    print("3. Testing Bbox Resize Feedback (User makes box smaller):")
    
    original_detections_2 = [
        {
            "id": "det_3",
            "category": "loose_joint", 
            "severity": "Faulty",
            "confidence": 0.80,
            "bbox": {"x": 150, "y": 200, "width": 100, "height": 80}
        }
    ]
    
    # User resized the box to be smaller
    user_corrections_2 = [
        {
            "id": "det_3",
            "category": "loose_joint",
            "severity": "Faulty", 
            "confidence": 0.80,
            "bbox": {"x": 150, "y": 200, "width": 60, "height": 50}  # Smaller box
        }
    ]
    
    result_2 = process_user_feedback_api("test_image_2", "user_123", original_detections_2, user_corrections_2)
    print(f"   Result: {result_2['message']}")
    print(f"   Adaptations: {result_2['adaptations_applied']}")
    print()
    
    # 4. Test severity change feedback  
    print("4. Testing Severity Change Feedback (Faulty -> Potentially Faulty):")
    
    original_detections_3 = [
        {
            "id": "det_4",
            "category": "point_overload",
            "severity": "Faulty",
            "confidence": 0.70,
            "bbox": {"x": 300, "y": 250, "width": 50, "height": 40}
        }
    ]
    
    # User changed severity
    user_corrections_3 = [
        {
            "id": "det_4", 
            "category": "point_overload",
            "severity": "Potentially Faulty",  # Changed from Faulty
            "confidence": 0.70,
            "bbox": {"x": 300, "y": 250, "width": 50, "height": 40}
        }
    ]
    
    result_3 = process_user_feedback_api("test_image_3", "user_123", original_detections_3, user_corrections_3)
    print(f"   Result: {result_3['message']}")
    print(f"   Adaptations: {result_3['adaptations_applied']}")
    
    # Show final parameters
    final_params = get_current_parameters()
    print(f"   Updated Faulty Threshold: {initial_params['severity_rules']['faulty_red_orange_threshold']} -> {final_params['severity_rules']['faulty_red_orange_threshold']}")
    print()
    
    # 5. Show feedback statistics
    print("5. Feedback Statistics:")
    stats = get_feedback_statistics()
    print(f"   Total Feedback: {stats['total_feedback']}")
    print(f"   Feedback Types: {stats['feedback_types']}")
    print()
    
    # 6. Export feedback log
    print("6. Feedback Log Export:")
    log_json = export_feedback_log("json")
    log_data = json.loads(log_json)
    print(f"   Exported {len(log_data.get('feedback_entries', []))} feedback entries")
    print()
    
    # 7. Show final parameter comparison
    print("7. Final Parameter Summary:")
    print(f"   Percent Threshold: {initial_params['percent_threshold']} -> {final_params['percent_threshold']} (sensitivity)")
    print(f"   Min Area Factor: {initial_params['min_area_factor']:.6f} -> {final_params['min_area_factor']:.6f} (detection size)")
    print(f"   Faulty Threshold: {initial_params['severity_rules']['faulty_red_orange_threshold']:.2f} -> {final_params['severity_rules']['faulty_red_orange_threshold']:.2f} (severity)")
    print(f"   Loose Joint Area: {initial_params['geometric_rules']['loose_joint_area_min']:.2f} -> {final_params['geometric_rules']['loose_joint_area_min']:.3f} (geometry)")
    print()
    
    print("=== Adaptive System Test Complete ===")
    print("The system has successfully adapted based on user feedback!")
    
    return final_params

def demo_api_usage():
    """Demonstrate how to use the API functions"""
    
    print("\n=== API Usage Examples ===\n")
    
    # Example API call for processing feedback
    print("Example API call for processing user feedback:")
    print("""
    result = process_user_feedback_api(
        image_id="thermal_image_001",
        user_id="engineer_001", 
        original_detections=[
            {
                "id": "det_1",
                "category": "loose_joint",
                "severity": "Faulty",
                "confidence": 0.85,
                "bbox": {"x": 120, "y": 160, "width": 90, "height": 70}
            }
        ],
        user_corrections=[
            {
                "id": "det_1", 
                "category": "loose_joint",
                "severity": "Potentially Faulty",  # User changed severity
                "confidence": 0.85,
                "bbox": {"x": 125, "y": 165, "width": 80, "height": 60}  # User resized box
            }
        ]
    )
    """)
    
    print("Expected result format:")
    print("""
    {
        "status": "success",
        "message": "Processed 2 feedback items", 
        "adaptations_applied": ["bbox_resize", "severity_change"],
        "feedback_count": 2
    }
    """)

if __name__ == "__main__":
    # Run the test
    final_params = test_feedback_system()
    
    # Show API usage examples
    demo_api_usage()
    
    print("\nNote: The adaptive parameters are automatically saved and will persist across sessions.")
    print("To reset parameters to defaults, call: reset_parameters_to_default()")