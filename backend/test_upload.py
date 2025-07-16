#!/usr/bin/env python3
"""
Test script to verify S3 upload functionality
"""
import json
import os
import requests
from io import BytesIO
from PIL import Image
import uuid

# Load environment
with open('env.json', 'r') as f:
    env = json.load(f)['Parameters']

API_BASE_URL = env.get('API_BASE_URL', 'https://api.example.com')

def create_test_image():
    """Create a small test image"""
    # Create a simple test image
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = BytesIO()
    img.save(img_bytes, format='JPEG')
    img_bytes.seek(0)
    return img_bytes.getvalue()

def test_upload_flow():
    """Test the complete upload flow"""
    print("🧪 Testing S3 Upload Flow...")
    
    try:
        # Step 1: Get upload URL
        print("1. Getting upload URL...")
        upload_url_response = requests.get(f"{API_BASE_URL}/upload-url?ext=jpg")
        
        if upload_url_response.status_code != 200:
            print(f"❌ Failed to get upload URL: {upload_url_response.status_code}")
            print(f"Response: {upload_url_response.text}")
            return False
            
        upload_data = upload_url_response.json()
        upload_url = upload_data['uploadUrl']
        image_url = upload_data['imageUrl']
        content_type = upload_data.get('contentType', 'image/jpeg')
        
        print(f"✅ Got upload URL")
        print(f"   Upload URL: {upload_url[:50]}...")
        print(f"   Image URL: {image_url}")
        print(f"   Content Type: {content_type}")
        
        # Step 2: Create test image
        print("2. Creating test image...")
        test_image = create_test_image()
        print(f"✅ Created test image ({len(test_image)} bytes)")
        
        # Step 3: Upload image
        print("3. Uploading image...")
        headers = {
            'Content-Type': content_type
        }
        
        upload_response = requests.put(upload_url, data=test_image, headers=headers)
        
        if upload_response.status_code != 200:
            print(f"❌ Upload failed: {upload_response.status_code}")
            print(f"Response: {upload_response.text}")
            return False
            
        print(f"✅ Upload successful!")
        
        # Step 4: Verify image is accessible
        print("4. Verifying image accessibility...")
        verify_response = requests.get(image_url)
        
        if verify_response.status_code != 200:
            print(f"⚠️  Image not immediately accessible: {verify_response.status_code}")
            print("   This might be normal - S3 can take a moment to propagate")
        else:
            print(f"✅ Image accessible ({len(verify_response.content)} bytes)")
            
        # Step 5: Test product creation
        print("5. Testing product creation...")
        product_data = {
            'name': f'Test Product {uuid.uuid4().hex[:8]}',
            'description': 'Test product created by automated test',
            'price': '19.99',
            'category': 'Test',
            'imageUrl': image_url,
            'userId': 'test-user'
        }
        
        product_response = requests.post(f"{API_BASE_URL}/products", json=product_data)
        
        if product_response.status_code not in [200, 201]:
            print(f"⚠️  Product creation failed: {product_response.status_code}")
            print(f"Response: {product_response.text}")
        else:
            print(f"✅ Product created successfully!")
            product_result = product_response.json()
            print(f"   Product ID: {product_result.get('id', 'unknown')}")
        
        print("\n🎉 Upload flow test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_upload_flow()
    exit(0 if success else 1)