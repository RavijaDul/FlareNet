#!/usr/bin/env python3
"""
Simple test script for the PatchCore model
"""
import sys
sys.path.append('.')

try:
    from models.simple_patchcore import SimplePatchcoreModel
    print('✅ Simple model imported successfully')
    
    model = SimplePatchcoreModel(
        'models/weights/model.ckpt',
        'configs/patchcore_config.yaml'
    )
    print('✅ Simple model instance created')
    
    # Check if files exist
    print('📂 Checking files:')
    import os
    print(f'Model file: {os.path.exists("models/weights/model.ckpt")}')
    print(f'Config file: {os.path.exists("configs/patchcore_config.yaml")}')
    
    success = model.initialize()
    print(f'Model initialization: {"✅ SUCCESS" if success else "❌ FAILED"}')
    
    if success:
        print('🎯 Testing prediction...')
        result = model.predict('uploads/test_image.jpg')
        print(f'📊 Anomaly Score: {result["anomaly_score"]:.3f}')
        print(f'🏷️  Classification: {result["classification"]}')
        print(f'📦 Bounding Boxes: {len(result["bounding_boxes"])}')
        print('✅ Simple model working!')
        
        # Print bounding box details
        for i, box in enumerate(result["bounding_boxes"]):
            print(f'  Box {i+1}: ({box["x1"]}, {box["y1"]}) to ({box["x2"]}, {box["y2"]})')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()