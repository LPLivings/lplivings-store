import json
import boto3
import uuid
from datetime import datetime
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

def get_sheets_service():
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(os.environ.get('GOOGLE_CREDENTIALS', '{}')),
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    return build('sheets', 'v4', credentials=credentials)

def lambda_handler(event, context):
    http_method = event['httpMethod']
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }
    
    if http_method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        if http_method == 'GET':
            return get_orders(event, headers)
        elif http_method == 'POST':
            return create_order(event, headers)
        else:
            return {
                'statusCode': 405,
                'headers': headers,
                'body': json.dumps({'error': 'Method not allowed'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def get_orders(event, headers):
    try:
        # Extract user ID from authorization token
        auth_header = event['headers'].get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Unauthorized'})
            }
        
        # Extract user ID from query parameters or decode from token
        query_params = event.get('queryStringParameters') or {}
        user_id = query_params.get('userId')
        
        if not user_id:
            # Try to extract from token payload (simplified for demo)
            token = auth_header.replace('Bearer ', '')
            # In production, you'd properly decode and verify the JWT token
            # For now, we'll require the userId to be passed as a query parameter
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'User ID required'})
            }
        
        service = get_sheets_service()
        sheet = service.spreadsheets()
        
        result = sheet.values().get(
            spreadsheetId=os.environ.get('GOOGLE_SHEETS_ID'),
            range='Orders!A2:G'  # Extended to include more columns
        ).execute()
        
        values = result.get('values', [])
        orders = []
        
        for row in values:
            if len(row) >= 6 and row[1] == user_id:  # Filter by user ID
                orders.append({
                    'id': row[0],
                    'userId': row[1],
                    'items': json.loads(row[2]) if row[2] else [],
                    'total': float(row[3]) if row[3] else 0,
                    'status': row[4] if row[4] else 'pending',
                    'createdAt': row[5] if len(row) > 5 else None,
                    'customerInfo': json.loads(row[6]) if len(row) > 6 and row[6] else {}
                })
        
        # Sort orders by creation date (newest first)
        orders.sort(key=lambda x: x['createdAt'] or '', reverse=True)
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(orders)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to fetch orders: {str(e)}'})
        }

def create_order(event, headers):
    try:
        body = json.loads(event['body'])
        order_id = str(uuid.uuid4())
        
        # Calculate total
        items = body.get('items', [])
        total = body.get('total', sum(item['price'] * item['quantity'] for item in items))
        
        # Add order to Google Sheets
        service = get_sheets_service()
        sheet = service.spreadsheets()
        
        values = [[
            order_id,
            body.get('userId', ''),
            json.dumps(items),
            total,
            body.get('status', 'pending'),
            datetime.now().isoformat(),
            json.dumps(body.get('customerInfo', {}))
        ]]
        
        sheet.values().append(
            spreadsheetId=os.environ.get('GOOGLE_SHEETS_ID'),
            range='Orders!A:G',
            valueInputOption='RAW',
            body={'values': values}
        ).execute()
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': order_id,
                'message': 'Order created successfully',
                'total': total,
                'status': 'pending'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to create order: {str(e)}'})
        }