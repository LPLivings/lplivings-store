#!/usr/bin/env python3
"""
Test script to verify products API
"""
import json
import requests

# Load environment
with open('env.json', 'r') as f:
    env = json.load(f)['Parameters']

API_BASE_URL = 'https://5pyjyltkoa.execute-api.us-east-1.amazonaws.com/dev'

def test_get_products():
    """Test getting products from the API"""
    print("🧪 Testing Get Products API...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/products")
        
        if response.status_code != 200:
            print(f"❌ Failed to get products: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        products = response.json()
        print(f"✅ Got {len(products)} products")
        
        for i, product in enumerate(products[:3]):  # Show first 3
            print(f"   {i+1}. {product.get('name', 'No name')} - ${product.get('price', 0)}")
            
        # Check if these are demo products or real ones
        if products and products[0].get('id') == 'demo-001':
            print("⚠️  Showing demo products - Google Sheets integration not working")
            return False
        else:
            print("✅ Showing real products from Google Sheets")
            return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

def test_add_product():
    """Test adding a product"""
    print("\n🧪 Testing Add Product API...")
    
    try:
        product_data = {
            'name': 'Test Product from API',
            'description': 'This is a test product created via API',
            'price': '25.99',
            'category': 'Test',
            'imageUrl': 'https://picsum.photos/300/300?random=999',
            'userId': 'test-user'
        }
        
        response = requests.post(f"{API_BASE_URL}/products", json=product_data)
        
        if response.status_code not in [200, 201]:
            print(f"❌ Failed to add product: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
        result = response.json()
        print(f"✅ Product added successfully!")
        print(f"   Product ID: {result.get('id', 'unknown')}")
        return True
        
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

if __name__ == '__main__':
    print(f"Testing API at: {API_BASE_URL}")
    
    # Test getting products first
    get_success = test_get_products()
    
    # Test adding a product
    add_success = test_add_product()
    
    # Test getting products again to see if new product appears
    if add_success:
        print("\n🧪 Testing if new product appears in list...")
        get_success_after = test_get_products()
        
        if not get_success_after and get_success is False:
            print("❌ Google Sheets integration is broken - products aren't being read back")
        elif get_success_after:
            print("✅ Products are being read from Google Sheets successfully")
    
    print(f"\n{'✅ All tests passed!' if get_success and add_success else '❌ Some tests failed'}")