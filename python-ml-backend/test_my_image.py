import requests
import json
import os
from pathlib import Path

def test_image_detection():
    """Test your uploaded image with ML backend"""
    
    # Your test image
    image_path = "uploads/test_image.jpg"
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ Image not found: {image_path}")
        print("Please make sure test_image.jpg is in the uploads/ folder")
        return
    
    print("="*70)
    print("🔍 TESTING THERMAL TRANSFORMER IMAGE WITH ML MODEL")
    print("="*70)
    print(f"📁 Image: {image_path}")
    print(f"📊 Size: {os.path.getsize(image_path):,} bytes")
    print()
    
    # API endpoint
    url = "http://localhost:8001/api/v1/detect-anomaly"
    
    try:
        # Send image to ML backend
        print("🚀 Sending image to ML backend for analysis...")
        with open(image_path, "rb") as f:
            files = {"file": ("test_image.jpg", f, "image/jpeg")}
            data = {"return_visualizations": "true", "threshold": "0.5"}
            
            response = requests.post(url, files=files, data=data, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            
            print("\n" + "="*70)
            print("✅ ANOMALY DETECTION RESULTS")
            print("="*70)
            
            # Main results
            print(f"\n📊 ANOMALY SCORE: {result.get('anomaly_score', 0):.4f} ({result.get('anomaly_score', 0)*100:.1f}%)")
            print(f"🏷️  CLASSIFICATION: {result.get('classification', 'Unknown')}")
            print(f"🎯 CONFIDENCE: {result.get('confidence', 'Unknown')}")
            print(f"⚠️  IS ANOMALOUS: {'YES ❌' if result.get('is_anomalous') else 'NO ✅'}")
            print(f"⏱️  PROCESSING TIME: {result.get('processing_time', 0)} seconds")
            
            # Bounding boxes
            boxes = result.get('bounding_boxes', [])
            print(f"\n📦 DETECTED ANOMALY REGIONS: {len(boxes)}")
            if boxes:
                print("-" * 70)
                for i, box in enumerate(boxes, 1):
                    print(f"  Region {i}:")
                    print(f"    Position: ({box.get('x', 0)}, {box.get('y', 0)})")
                    print(f"    Size: {box.get('width', 0)}px × {box.get('height', 0)}px")
                    print(f"    Type: {box.get('type', 'Unknown')}")
                    print(f"    Confidence: {box.get('confidence', 0):.1%}")
                    print()
            
            # Visualization files
            viz = result.get('visualizations', {})
            if viz:
                print("🎨 GENERATED VISUALIZATION FILES:")
                print("-" * 70)
                
                for viz_type, path in viz.items():
                    full_url = f"http://localhost:8001{path}"
                    print(f"  {viz_type.replace('_url', '').upper()}: {full_url}")
                
                # Copy visualization files to Windows accessible location
                print("\n📂 COPYING VISUALIZATIONS TO WINDOWS...")
                output_dir = Path("/mnt/c/temp/flarenet_ml_results")
                output_dir.mkdir(parents=True, exist_ok=True)
                
                # Copy generated files
                for viz_type, path in viz.items():
                    source = Path(f".{path}")  # Remove leading slash
                    if source.exists():
                        dest = output_dir / source.name
                        import shutil
                        shutil.copy2(source, dest)
                        print(f"  ✅ Copied: {source.name}")
                
                print(f"\n📁 View annotated images in Windows at:")
                print(f"   C:\\temp\\flarenet_ml_results\\")
                print()
            
            # Summary
            print("="*70)
            print("🎯 SUMMARY")
            print("="*70)
            classification = result.get('classification', '').upper()
            
            if classification == 'FAULTY':
                print("❌ CRITICAL: Transformer shows FAULTY condition")
                print("⚠️  Immediate maintenance required")
                print(f"🔍 {len(boxes)} anomalous region(s) detected")
            elif classification == 'OVERLOWAY':
                print("⚠️  WARNING: Transformer shows moderate anomalies")
                print("📋 Schedule inspection soon")
            elif classification == 'POTENTIAL':
                print("⚡ CAUTION: Potential issues detected")
                print("👁️  Monitor closely")
            else:
                print("✅ NORMAL: No significant anomalies detected")
                print("✓  Continue normal operation")
            
            print("="*70)
            
            return result
            
        else:
            print(f"\n❌ ERROR: Server returned status {response.status_code}")
            print(f"Response: {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to ML backend")
        print("Make sure the server is running with: python main.py")
        return None
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_image_detection()
