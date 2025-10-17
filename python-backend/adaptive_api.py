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
    
    Expected JSON payload:
    {
        "image_id": "thermal_001",
        "user_id": "engineer_123", 
        "original_detections": [...],
        "user_corrections": [...]
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
        
        required_fields = ["image_id", "user_id", "original_detections", "user_corrections"]
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        result = process_user_feedback_api(
            image_id=data["image_id"],
            user_id=data["user_id"],
            original_detections=data["original_detections"],
            user_corrections=data["user_corrections"]
        )
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "FlareNet Adaptive Feedback System",
        "version": "1.0.0"
    }), 200

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