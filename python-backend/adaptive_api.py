"""
Flask API wrapper for FlareNet Adaptive Feedback System

This provides HTTP endpoints for the Java backend to send user feedback
and receive adaptive parameter updates.
"""

from flask import Flask, request, jsonify
from model_core import (
    process_user_feedback_api,
    get_current_parameters, 
    get_feedback_statistics,
    export_feedback_log,
    reset_parameters_to_default
)
import json

app = Flask(__name__)

@app.route('/api/feedback', methods=['POST'])
def process_feedback():
    """
    Process user feedback and adapt model parameters
    
    Expected format from your database:
    {
        "image_id": "123",
        "user_id": "H1210",
        "original_detections": {
            "status": "Anomalies", 
            "anomalies": [...]  // analysis_result format
        },
        "user_corrections": {
            "status": "Anomalies",
            "anomalies": [...]  // user_annotations format with isDeleted, isUserAdded, etc.
        }
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        # Extract data with defaults
        image_id = data.get("image_id", "unknown")
        user_id = data.get("user_id", "user")
        
        # Convert analysis_result format to standard format
        original_analysis = data.get("original_detections", {})
        original_detections = []
        
        if "anomalies" in original_analysis:
            for i, anomaly in enumerate(original_analysis["anomalies"]):
                original_detections.append({
                    "id": f"orig_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"),
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {})
                })
        
        # Convert user_annotations format to standard format
        user_annotations = data.get("user_corrections", {})
        user_corrections = []
        
        if "anomalies" in user_annotations:
            for i, anomaly in enumerate(user_annotations["anomalies"]):
                # Skip deleted annotations 
                if anomaly.get("isDeleted", False):
                    continue
                    
                user_corrections.append({
                    "id": f"corr_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"),
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {}),
                    "isUserAdded": anomaly.get("isUserAdded", False),
                    "edited": anomaly.get("edited", False),
                    "editReason": anomaly.get("editReason", "")
                })
        
        # Process through adaptive system
        result = process_user_feedback_api(image_id, user_id, original_detections, user_corrections)
        
        # Enhanced response with current parameters
        response = {
            "status": "success",
            "message": result.get("message", "Feedback processed"),
            "adaptations_applied": result.get("adaptations_applied", []),
            "feedback_count": result.get("feedback_count", 0),
            "original_count": len(original_detections),
            "corrected_count": len(user_corrections),
            "deleted_count": sum(1 for a in user_annotations.get("anomalies", []) if a.get("isDeleted", False)),
            "added_count": sum(1 for a in user_annotations.get("anomalies", []) if a.get("isUserAdded", False)),
            "current_parameters": {
                "percent_threshold": result.get("current_threshold"),
                "adaptations_summary": result.get("adaptations_applied", [])
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error processing feedback: {str(e)}")
        return jsonify({"error": str(e), "status": "error"}), 500

@app.route('/api/parameters', methods=['GET'])
def get_parameters():
    """Get current adaptive parameters"""
    try:
        params = get_current_parameters()
        return jsonify({
            "status": "success",
            "parameters": params
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/parameters/reset', methods=['POST'])
def reset_parameters():
    """Reset parameters to default values"""
    try:
        result = reset_parameters_to_default()
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/feedback/statistics', methods=['GET'])
def get_statistics():
    """Get feedback statistics"""
    try:
        stats = get_feedback_statistics()
        return jsonify({
            "status": "success",
            "statistics": stats
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/feedback/export', methods=['GET'])
def export_log():
    """Export feedback log"""
    try:
        format_type = request.args.get('format', 'json')
        log_data = export_feedback_log(format_type)
        
        if format_type.lower() == 'csv':
            return log_data, 200, {'Content-Type': 'text/csv'}
        else:
            return log_data, 200, {'Content-Type': 'application/json'}
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/process-annotation-feedback', methods=['POST'])
def process_annotation_feedback():
    """
    Process feedback from annotation controller
    Expects data in the exact format from your database
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        # Get thermal image ID from request
        thermal_image_id = data.get("thermal_image_id")
        user_id = data.get("user_id", "unknown")
        
        # Get original analysis result JSON (from analysis_result table)
        original_json = data.get("original_analysis_json", "{}")
        if isinstance(original_json, str):
            original_analysis = json.loads(original_json)
        else:
            original_analysis = original_json
            
        # Get user annotations JSON (from user_annotations table) 
        user_json = data.get("user_annotations_json", "{}")
        if isinstance(user_json, str):
            user_annotations = json.loads(user_json)
        else:
            user_annotations = user_json
        
        # Process the feedback
        feedback_result = {
            "image_id": str(thermal_image_id),
            "user_id": user_id,
            "original_detections": original_analysis,
            "user_corrections": user_annotations
        }
        
        # Send to main feedback processor
        internal_response = process_feedback_internal(feedback_result)
        
        return jsonify({
            "status": "success",
            "thermal_image_id": thermal_image_id,
            "processing_result": internal_response,
            "message": "Annotation feedback processed successfully"
        }), 200
        
    except Exception as e:
        print(f"Error in annotation feedback: {str(e)}")
        return jsonify({
            "status": "error", 
            "error": str(e),
            "message": "Failed to process annotation feedback"
        }), 500

def process_feedback_internal(feedback_data):
    """Internal function to process feedback data"""
    try:
        image_id = feedback_data.get("image_id", "unknown")
        user_id = feedback_data.get("user_id", "user")
        
        # Convert analysis_result format to standard format
        original_analysis = feedback_data.get("original_detections", {})
        original_detections = []
        
        if "anomalies" in original_analysis:
            for i, anomaly in enumerate(original_analysis["anomalies"]):
                original_detections.append({
                    "id": f"orig_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"),
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {})
                })
        
        # Convert user_annotations format to standard format
        user_annotations = feedback_data.get("user_corrections", {})
        user_corrections = []
        deleted_count = 0
        added_count = 0
        
        if "anomalies" in user_annotations:
            for i, anomaly in enumerate(user_annotations["anomalies"]):
                if anomaly.get("isDeleted", False):
                    deleted_count += 1
                    continue
                    
                if anomaly.get("isUserAdded", False):
                    added_count += 1
                    
                user_corrections.append({
                    "id": f"corr_{i}",
                    "category": anomaly.get("category", "unknown"),
                    "severity": anomaly.get("severity", "Unknown"),
                    "confidence": anomaly.get("confidence", 0.5),
                    "bbox": anomaly.get("bbox", {}),
                    "isUserAdded": anomaly.get("isUserAdded", False),
                    "edited": anomaly.get("edited", False)
                })
        
        # Process through adaptive system
        result = process_user_feedback_api(image_id, user_id, original_detections, user_corrections)
        
        # Get current parameters for response
        current_params = get_current_parameters()
        
        return {
            "adaptations_applied": result.get("adaptations_applied", []),
            "feedback_count": result.get("feedback_count", 0),
            "original_count": len(original_detections),
            "corrected_count": len(user_corrections),
            "deleted_count": deleted_count,
            "added_count": added_count,
            "current_threshold": current_params.get("percent_threshold", 50),
            "processing_status": result.get("status", "unknown")
        }
        
    except Exception as e:
        return {"error": str(e), "status": "error"}

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test adaptive system
        params = get_current_parameters()
        return jsonify({
            "status": "healthy",
            "service": "FlareNet Adaptive Feedback System",
            "version": "1.0.0",
            "current_threshold": params.get("percent_threshold", 50),
            "parameters_loaded": len(params) > 0
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e)
        }), 500

@app.route('/api/docs', methods=['GET'])
def api_documentation():
    """API documentation endpoint"""
    docs = {
        "title": "FlareNet Adaptive Feedback API",
        "version": "1.0.0",
        "description": "API for processing user feedback and adapting model parameters",
        "endpoints": {
            "POST /api/feedback": {
                "description": "Process user feedback",
                "parameters": {
                    "image_id": "string - Unique image identifier",
                    "user_id": "string - User who provided feedback", 
                    "original_detections": "array - Original model detections",
                    "user_corrections": "array - User-corrected detections"
                },
                "response": {
                    "status": "success/error",
                    "message": "Description of processing result",
                    "adaptations_applied": "array - Types of adaptations made",
                    "feedback_count": "number - Number of feedback items processed"
                }
            },
            "GET /api/parameters": {
                "description": "Get current adaptive parameters",
                "response": {
                    "status": "success",
                    "parameters": "object - Current parameter values"
                }
            },
            "POST /api/parameters/reset": {
                "description": "Reset parameters to defaults",
                "response": {
                    "status": "success",
                    "message": "Confirmation message"
                }
            },
            "GET /api/feedback/statistics": {
                "description": "Get feedback statistics",
                "response": {
                    "status": "success", 
                    "statistics": "object - Feedback statistics"
                }
            },
            "GET /api/feedback/export": {
                "description": "Export feedback log",
                "parameters": {
                    "format": "string - 'json' or 'csv' (optional, default: json)"
                },
                "response": "Feedback log in requested format"
            },
            "GET /api/health": {
                "description": "Health check",
                "response": {
                    "status": "healthy",
                    "service": "service name",
                    "version": "version number"
                }
            }
        }
    }
    
    return jsonify(docs), 200

if __name__ == '__main__':
    print("Starting FlareNet Adaptive Feedback API...")
    print("Available endpoints:")
    print("  POST /api/feedback - Process user feedback")
    print("  GET  /api/parameters - Get current parameters")
    print("  POST /api/parameters/reset - Reset parameters")
    print("  GET  /api/feedback/statistics - Get statistics")
    print("  GET  /api/feedback/export - Export feedback log")
    print("  GET  /api/health - Health check")
    print("  GET  /api/docs - API documentation")
    print()
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=True)