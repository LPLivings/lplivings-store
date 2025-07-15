#!/usr/bin/env python3
"""
Direct test of payment function without SAM
"""
import json
import os
import sys

# Add lambda_functions directory to path
sys.path.insert(0, './lambda_functions')
# Also add the build directory
sys.path.insert(0, './.aws-sam/build/PaymentFunction')

def test_payment_function_import():
    """Test if payment function can be imported"""
    
    print("🔍 Testing Payment Function Import")
    print("=" * 50)
    
    try:
        # Load environment variables from env.dev.json
        import json
        with open('env.dev.json', 'r') as f:
            env_data = json.load(f)
            for key, value in env_data['Parameters'].items():
                os.environ[key] = value
        
        # Try to import the payment module
        import payment
        print("✅ Payment module imported successfully")
        
        # Check if stripe is available
        if hasattr(payment, 'stripe') and payment.stripe:
            print("✅ Stripe module available")
            print(f"✅ Stripe API key configured: {bool(payment.stripe.api_key)}")
        else:
            print("❌ Stripe module not available")
            
        return payment
        
    except ImportError as e:
        print(f"❌ Import Error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected Error: {e}")
        return None

def test_lambda_handler_direct(payment_module):
    """Test the lambda handler directly"""
    
    print("\n🧪 Testing Lambda Handler Directly")
    print("=" * 50)
    
    if not payment_module:
        print("❌ Payment module not available")
        return
    
    # Create test event
    test_event = {
        'httpMethod': 'POST',
        'path': '/create-payment-intent',
        'body': json.dumps({
            "amount": 2999,
            "currency": "usd", 
            "customerEmail": "test@example.com",
            "orderDetails": {
                "orderId": "test_123",
                "customerId": "user_456"
            }
        }),
        'headers': {
            'Content-Type': 'application/json'
        }
    }
    
    # Create test context
    class TestContext:
        def __init__(self):
            self.function_name = "test-payment-function"
            self.function_version = "1"
            self.invoked_function_arn = "test-arn"
            self.memory_limit_in_mb = 128
            self.remaining_time_in_millis = 30000
    
    context = TestContext()
    
    print("📝 Test Event:")
    print(json.dumps(test_event, indent=2))
    print()
    
    try:
        # Call the lambda handler
        result = payment_module.lambda_handler(test_event, context)
        
        print(f"📊 Response Status Code: {result.get('statusCode')}")
        print(f"📋 Response Headers: {result.get('headers')}")
        
        if result.get('body'):
            try:
                body = json.loads(result['body'])
                print(f"📄 Response Body:")
                print(json.dumps(body, indent=2))
            except:
                print(f"📄 Response Body (raw): {result['body']}")
        
        return result
        
    except Exception as e:
        print(f"❌ Lambda Handler Error: {e}")
        import traceback
        print(f"📍 Traceback:")
        traceback.print_exc()
        return None

def test_health_endpoint(payment_module):
    """Test the health check endpoint"""
    
    print("\n🏥 Testing Health Check Endpoint")
    print("=" * 50)
    
    if not payment_module:
        print("❌ Payment module not available")
        return
    
    # Create health check event
    health_event = {
        'httpMethod': 'GET',
        'path': '/health',
        'body': None,
        'headers': {}
    }
    
    class TestContext:
        pass
    
    try:
        result = payment_module.lambda_handler(health_event, TestContext())
        
        print(f"📊 Health Check Status: {result.get('statusCode')}")
        
        if result.get('body'):
            try:
                body = json.loads(result['body'])
                print(f"✅ Health Check Response:")
                print(json.dumps(body, indent=2))
            except:
                print(f"📄 Health Check Body: {result['body']}")
                
    except Exception as e:
        print(f"❌ Health Check Error: {e}")

if __name__ == "__main__":
    print("🔧 Direct Payment Function Testing")
    print("=" * 60)
    
    # Test import
    payment_module = test_payment_function_import()
    
    # Test health check
    test_health_endpoint(payment_module)
    
    # Test payment intent creation
    test_lambda_handler_direct(payment_module)
    
    print("\n" + "=" * 60)
    print("🏁 Direct Testing Complete!")
    print("\n💡 This tests the function without SAM/API Gateway")