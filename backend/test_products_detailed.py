#!/usr/bin/env python3
import requests
import json

API_BASE_URL = 'https://5pyjyltkoa.execute-api.us-east-1.amazonaws.com/dev'

def test_detailed():
    print("🔍 Detailed Products Test...")
    
    response = requests.get(f"{API_BASE_URL}/products")
    if response.status_code == 200:
        products = response.json()
        print(f"✅ Got {len(products)} products:")
        
        for i, product in enumerate(products):
            print(f"   {i+1}. {product.get('name', 'No name')} - ${product.get('price', 0)} (ID: {product.get('id', 'No ID')})")
            
        # Check if products have real IDs or demo IDs
        demo_count = sum(1 for p in products if p.get('id', '').startswith('demo-'))
        real_count = len(products) - demo_count
        
        print(f"\n📊 Summary:")
        print(f"   Demo products: {demo_count}")
        print(f"   Real products: {real_count}")
        
        if real_count > 0:
            print("✅ S3 storage is working! Real products are being saved and loaded.")
        else:
            print("❌ S3 storage not working - only demo products found.")
            
    else:
        print(f"❌ API call failed: {response.status_code}")
        print(response.text)

if __name__ == '__main__':
    test_detailed()