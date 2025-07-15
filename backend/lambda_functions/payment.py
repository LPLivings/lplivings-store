import json
import os
import traceback

try:
    import stripe
    print("Stripe imported successfully")
except ImportError as e:
    print(f"Failed to import stripe: {e}")
    stripe = None

try:
    import boto3
except ImportError as e:
    print(f"Failed to import boto3: {e}")
    boto3 = None

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
except ImportError as e:
    print(f"Failed to import Google API client: {e}")
    service_account = None
    build = None

from datetime import datetime

# Initialize Stripe
if stripe:
    stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')
    print(f"Stripe API key configured: {bool(stripe.api_key and len(stripe.api_key) > 10)}")
else:
    print("Stripe not available")

def lambda_handler(event, context):
    print(f"Lambda invoked with event: {json.dumps(event)}")
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    if event['httpMethod'] == 'OPTIONS':
        print("Handling OPTIONS request")
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        path = event.get('path', '')
        print(f"Request path: {path}")
        
        # Add health check endpoint
        if '/health' in path:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'status': 'healthy',
                    'stripe_configured': bool(stripe and stripe.api_key and 'placeholder' not in stripe.api_key)
                })
            }
        elif '/create-payment-intent' in path:
            return create_payment_intent(event, headers)
        elif '/confirm-payment' in path:
            return confirm_payment(event, headers)
        else:
            print(f"Unknown path: {path}")
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': f'Endpoint not found: {path}'})
            }
            
    except Exception as e:
        print(f"Payment lambda error: {str(e)}")
        import traceback
        print(f"Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }

def create_payment_intent(event, headers):
    """Create a Stripe payment intent for checkout"""
    
    try:
        print(f"Payment intent request received")
        
        # Check if Stripe is available
        if not stripe:
            print("Stripe module not available")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Payment processing module not available'})
            }
        
        body = json.loads(event['body'])
        print(f"Parsed body: {body}")
        
        amount = body.get('amount')  # Amount in cents
        currency = body.get('currency', 'usd')
        customer_email = body.get('customerEmail')
        order_details = body.get('orderDetails', {})
        
        print(f"Amount: {amount}, Currency: {currency}, Email: {customer_email}")
        
        if not amount or amount <= 0:
            print(f"Invalid amount: {amount}")
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid amount'})
            }
        
        # Check if Stripe key is configured
        if not stripe.api_key or 'placeholder' in stripe.api_key or len(stripe.api_key) < 10:
            print(f"Stripe API key not configured properly. Key length: {len(stripe.api_key) if stripe.api_key else 0}")
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Payment processing not configured properly'})
            }
        
        print(f"Creating Stripe payment intent for amount: {amount}")
        
        # Create payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(amount),
            currency=currency,
            payment_method_types=['card'],
            metadata={
                'customer_email': customer_email or '',
                'order_id': order_details.get('orderId', ''),
                'customer_id': order_details.get('customerId', ''),
            }
        )
        
        print(f"Payment intent created successfully: {intent.id}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id,
                'orderId': order_details.get('orderId', '')
            })
        }
        
    except stripe.error.StripeError as e:
        print(f"Stripe error: {str(e)}")
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': f'Stripe error: {str(e)}'})
        }
    except Exception as e:
        print(f"General error in create_payment_intent: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }

def confirm_payment(event, headers):
    """Confirm payment and create order record"""
    
    try:
        body = json.loads(event['body'])
        payment_intent_id = body.get('paymentIntentId')
        order_details = body.get('orderDetails', {})
        
        if not payment_intent_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Payment intent ID required'})
            }
        
        # Retrieve payment intent to verify status
        intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        if intent.status != 'succeeded':
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({
                    'error': 'Payment not completed',
                    'status': intent.status
                })
            }
        
        # Create order record in Google Sheets
        order_id = create_order_record(intent, order_details)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'success': True,
                'orderId': order_id,
                'paymentStatus': intent.status,
                'amountReceived': intent.amount_received
            })
        }
        
    except stripe.error.StripeError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def create_order_record(payment_intent, order_details):
    """Create order record in Google Sheets"""
    
    try:
        # Get Google Sheets service
        google_creds = os.environ.get('GOOGLE_CREDENTIALS', '{}')
        if google_creds == '{}' or 'placeholder' in google_creds:
            print("No Google credentials, skipping order record")
            return f"order_{payment_intent.id}"
        
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(google_creds),
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        service = build('sheets', 'v4', credentials=credentials)
        
        # Prepare order data
        order_id = f"order_{payment_intent.id}"
        timestamp = datetime.now().isoformat()
        
        order_row = [
            order_id,
            order_details.get('customerId', ''),
            json.dumps(order_details.get('items', [])),
            order_details.get('totalAmount', 0),
            'processing',  # order status
            timestamp,
            json.dumps(order_details.get('shippingInfo', {}))
        ]
        
        # Add to Google Sheets
        sheets_id = os.environ.get('GOOGLE_SHEETS_ID', '')
        if sheets_id:
            service.spreadsheets().values().append(
                spreadsheetId=sheets_id,
                range='Orders!A:G',
                valueInputOption='RAW',
                body={'values': [order_row]}
            ).execute()
        
        return order_id
        
    except Exception as e:
        print(f"Error creating order record: {str(e)}")
        return f"order_{payment_intent.id}"

def get_sheets_service():
    """Get Google Sheets service"""
    try:
        google_creds = os.environ.get('GOOGLE_CREDENTIALS', '{}')
        if google_creds == '{}' or 'placeholder' in google_creds:
            return None
            
        credentials = service_account.Credentials.from_service_account_info(
            json.loads(google_creds),
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        return build('sheets', 'v4', credentials=credentials)
    except Exception as e:
        print(f"Failed to get sheets service: {e}")
        return None