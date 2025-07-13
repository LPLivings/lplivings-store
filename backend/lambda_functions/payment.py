import json
import os
import boto3
import stripe
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', '')

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
    }
    
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        path = event.get('path', '')
        
        if '/create-payment-intent' in path:
            return create_payment_intent(event, headers)
        elif '/confirm-payment' in path:
            return confirm_payment(event, headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Endpoint not found'})
            }
            
    except Exception as e:
        print(f"Payment error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def create_payment_intent(event, headers):
    """Create a Stripe payment intent for checkout"""
    
    try:
        body = json.loads(event['body'])
        amount = body.get('amount')  # Amount in cents
        currency = body.get('currency', 'usd')
        customer_email = body.get('customerEmail')
        order_details = body.get('orderDetails', {})
        
        if not amount or amount <= 0:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Invalid amount'})
            }
        
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
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'clientSecret': intent.client_secret,
                'paymentIntentId': intent.id
            })
        }
        
    except stripe.error.StripeError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
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