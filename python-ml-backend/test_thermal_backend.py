#!/usr/bin/env python3
"""
Final integration test for the enhanced thermal ML backend
"""
import requests
import os
import json
import sys
from pathlib import Path

def test_enhanced_thermal_backend():
    """Test the complete thermal visualization pipeline"""
    
    print("="*70)
    print("🔥 TESTING ENHANCED THERMAL ML BACKEND")
    print("="*70)
    
    # Configuration
    api_url = "http://localhost:8001"
    test_image = "uploads/test_image.jpg"
    
    if not os.path.exists(test_image):
        print(f"❌ Test image not found: {test_image}")
        return False
    
    print(f"📁 Test Image: {test_image}")
    print(f"📊 Size: {os.path.getsize(test_image):,} bytes")
    print()
    
    try:
        # Test 1: Health Check
        print("🔍 Step 1: Testing server health...")
        health_response = requests.get(f"{api_url}/health", timeout=5)
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ Server Status: {health_data.get('status', 'unknown')}")
            print(f"✅ Model Loaded: {health_data.get('model_loaded', False)}")
            print(f"✅ Version: {health_data.get('version', 'unknown')}")
        else:
            print(f"❌ Health check failed: {health_response.status_code}")
            return False
        
        print()
        
        # Test 2: Thermal Anomaly Detection
        print("🚀 Step 2: Testing thermal anomaly detection...")
        
        with open(test_image, "rb") as f:
            files = {"file": f}
            data = {
                "return_visualizations": "true",
                "threshold": "0.5"
            }
            
            response = requests.post(
                f"{api_url}/api/v1/detect-anomaly",
                files=files,
                data=data,
                timeout=60
            )
        
        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        result = response.json()
        
        # Display Results
        print("="*70)
        print("✅ THERMAL ANOMALY DETECTION RESULTS")
        print("="*70)
        print()
        
        print(f"📊 ANOMALY SCORE: {result.get('anomaly_score', 0):.4f} ({result.get('anomaly_score', 0)*100:.1f}%)")
        print(f"🏷️  CLASSIFICATION: {result.get('classification', 'Unknown')}")
        print(f"🎯 CONFIDENCE: {result.get('confidence', 'Unknown')}")
        print(f"⚠️  IS ANOMALOUS: {'YES ❌' if result.get('is_anomalous', False) else 'NO ✅'}")
        print(f"⏱️  PROCESSING TIME: {result.get('processing_time', 0)} seconds")
        print()
        
        # Bounding Boxes
        bounding_boxes = result.get('bounding_boxes', [])
        print(f"📦 DETECTED ANOMALY REGIONS: {len(bounding_boxes)}")
        print("-"*70)
        
        for i, box in enumerate(bounding_boxes, 1):
            x1, y1, x2, y2 = box['x1'], box['y1'], box['x2'], box['y2']
            width, height = x2 - x1, y2 - y1
            confidence = box.get('confidence', 0) * 100
            
            print(f"  Region {i}:")
            print(f"    Position: ({x1}, {y1})")
            print(f"    Size: {width}px × {height}px")
            print(f"    Confidence: {confidence:.1f}%")
            print()
        
        # Visualizations
        visualizations = result.get('visualizations', {})
        if visualizations:
            print("🎨 GENERATED THERMAL VISUALIZATION FILES:")
            print("-"*70)
            
            for viz_type, url in visualizations.items():
                if url:
                    full_url = f"{api_url}{url}"
                    print(f"  {viz_type.upper()}: {full_url}")
            print()
        
        # Test 3: Check Generated Files
        print("📁 Step 3: Checking generated visualization files...")
        
        output_dirs = ["outputs/overlays", "outputs/masks", "outputs/filtered", "outputs/bounded"]
        generated_files = []
        
        for output_dir in output_dirs:
            if os.path.exists(output_dir):
                for file_path in Path(output_dir).glob("*.png"):
                    generated_files.append(str(file_path))
                    file_size = os.path.getsize(file_path)
                    print(f"  ✅ {file_path} ({file_size:,} bytes)")
        
        if not generated_files:
            print("  ⚠️  No visualization files found in outputs/")
        
        print()
        
        # Test 4: Copy to Windows
        print("💾 Step 4: Copying results to Windows accessible location...")
        
        windows_path = Path("/mnt/c/temp/flarenet_thermal_test_results")
        windows_path.mkdir(parents=True, exist_ok=True)
        
        copied_count = 0
        for file_path in generated_files:
            try:
                src = Path(file_path)
                dst = windows_path / src.name
                
                import shutil
                shutil.copy2(src, dst)
                copied_count += 1
                print(f"  📋 Copied: {src.name}")
                
            except Exception as e:
                print(f"  ❌ Failed to copy {file_path}: {e}")
        
        print(f"  ✅ {copied_count} files copied to C:\\temp\\flarenet_thermal_test_results\\")
        print()
        
        # Summary
        print("="*70)
        print("🎯 TEST SUMMARY")
        print("="*70)
        print(f"✅ Server Health: PASSED")
        print(f"✅ Anomaly Detection: PASSED")
        print(f"✅ Thermal Visualization: {'PASSED' if visualizations else 'PARTIAL'}")
        print(f"✅ File Generation: {'PASSED' if generated_files else 'FAILED'}")
        print(f"✅ Windows Access: {'PASSED' if copied_count > 0 else 'FAILED'}")
        print()
        
        if result.get('is_anomalous'):
            print("🔥 SUCCESS: Thermal transformer fault detected with thermal overlays!")
        else:
            print("✅ SUCCESS: System working normally")
        
        print(f"📂 View results in Windows File Explorer: C:\\temp\\flarenet_thermal_test_results\\")
        print("🎨 Look for '*_overlay_filtered.png' files with thermal coloring and bounding boxes!")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to ML backend server")
        print("Make sure the server is running with: python main.py")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_enhanced_thermal_backend()
    sys.exit(0 if success else 1)