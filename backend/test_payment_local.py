#!/usr/bin/env python3
"""
Local test for payment function
"""
import json
import requests
import sys

def test_payment_intent_creation():
    """Test creating a payment intent locally"""
    
    print("🧪 Testing Payment Intent Creation Locally")
    print("=" * 50)
    
    # Test data
    test_data = {
        "amount": 2999,  # $29.99 in cents
        "currency": "usd",
        "customerEmail": "test@example.com",
        "orderDetails": {
            "orderId": "test_order_123",
            "customerId": "test_user_456",
            "customerName": "Test User",
            "items": [
                {
                    "productId": "prod_1",
                    "name": "Test Product",
                    "price": 29.99,
                    "quantity": 1,
                    "total": 29.99
                }
            ],
            "totalAmount": 29.99,
            "shippingInfo": {
                "name": "Test User",
                "email": "test@example.com",
                "address": "123 Test St",
                "city": "Test City",
                "zipCode": "12345"
            }
        }
    }
    
    print(f"📝 Test Data:")
    print(json.dumps(test_data, indent=2))
    print()
    
    try:
        # Test local SAM endpoint
        local_url = "http://127.0.0.1:3000/create-payment-intent"
        
        print(f"🌐 Making request to: {local_url}")
        
        response = requests.post(
            local_url,
            json=test_data,
            headers={
                "Content-Type": "application/json"
            },
            timeout=10
        )
        
        print(f"📊 Response Status: {response.status_code}")
        print(f"📋 Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success! Response:")
            print(json.dumps(result, indent=2))
            
            # Check if we got the expected fields
            if 'clientSecret' in result:
                print(f"✅ Client Secret received: {result['clientSecret'][:20]}...")
            if 'paymentIntentId' in result:
                print(f"✅ Payment Intent ID: {result['paymentIntentId']}")
                
        else:
            print(f"❌ Failed! Response:")
            try:
                error_data = response.json()
                print(json.dumps(error_data, indent=2))
            except:
                print(response.text)
                
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: SAM local server is not running")
        print("💡 Start it with: sam local start-api --env-vars env.dev.json")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_health_check():
    """Test the health check endpoint"""
    
    print("\n🏥 Testing Health Check Endpoint")
    print("=" * 50)
    
    try:
        local_url = "http://127.0.0.1:3000/health"
        
        response = requests.get(local_url, timeout=5)
        
        print(f"📊 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Health Check Response:")
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Health Check Failed:")
            print(response.text)
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: SAM local server is not running")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    print("🚀 Local Payment Function Testing")
    print("=" * 60)
    
    # First test health check
    test_health_check()
    
    # Then test payment intent creation
    test_payment_intent_creation()
    
    print("\n" + "=" * 60)
    print("🏁 Testing Complete!")
    print("\n💡 To run SAM local server:")
    print("   sam local start-api --env-vars env.dev.json")