import requests
import json
from pathlib import Path

def test_api_endpoints():
    """Test all API endpoints"""
    base_url = "http://localhost:8001"
    
    print("Testing FlareNet Python ML Backend API...")
    print("=" * 50)
    
    # Test health check
    print("1. Testing health check...")
    try:
        response = requests.get(f"{base_url}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test model info
    print("2. Testing model info...")
    try:
        response = requests.get(f"{base_url}/api/v1/model-info")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    
    # Test single image detection (if test image exists)
    test_image_path = Path("test_image.jpg")
    if test_image_path.exists():
        print("3. Testing single image detection...")
        try:
            with open(test_image_path, 'rb') as f:
                files = {'file': f}
                data = {'return_visualizations': True, 'threshold': 0.5}
                response = requests.post(
                    f"{base_url}/api/v1/detect-anomaly", 
                    files=files, 
                    data=data
                )
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                result = response.json()
                print(f"   Anomaly Score: {result.get('anomaly_score', 'N/A')}")
                print(f"   Classification: {result.get('classification', 'N/A')}")
                print(f"   Bounding Boxes: {len(result.get('bounding_boxes', []))}")
                print(f"   Processing Time: {result.get('processing_time', 'N/A')}s")
            else:
                print(f"   Error: {response.text}")
        except Exception as e:
            print(f"   Error: {e}")
    else:
        print("3. Skipping image test (no test_image.jpg found)")
    
    print()
    
    # Test detailed health check
    print("4. Testing detailed health check...")
    try:
        response = requests.get(f"{base_url}/api/v1/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    print()
    print("API testing completed!")

if __name__ == "__main__":
    test_api_endpoints()