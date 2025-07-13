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
        
        # For now, we'll parse the user ID from the event
        # In production, you'd verify the token and extract the user ID
        
        service = get_sheets_service()
        sheet = service.spreadsheets()
        
        result = sheet.values().get(
            spreadsheetId=os.environ.get('GOOGLE_SHEETS_ID'),
            range='Orders!A2:F'
        ).execute()
        
        values = result.get('values', [])
        orders = []
        
        for row in values:
            if len(row) >= 5:
                orders.append({
                    'id': row[0],
                    'userId': row[1],
                    'items': json.loads(row[2]),
                    'total': float(row[3]),
                    'status': row[4],
                    'createdAt': row[5] if len(row) > 5 else None
                })
        
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
        items = body['items']
        total = sum(item['price'] * item['quantity'] for item in items)
        
        # Add order to Google Sheets
        service = get_sheets_service()
        sheet = service.spreadsheets()
        
        values = [[
            order_id,
            body.get('userId', ''),
            json.dumps(items),
            total,
            'pending',
            datetime.now().isoformat()
        ]]
        
        sheet.values().append(
            spreadsheetId=os.environ.get('GOOGLE_SHEETS_ID'),
            range='Orders!A:F',
            valueInputOption='RAW',
            body={'values': values}
        ).execute()
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': order_id,
                'message': 'Order created successfully',
                'total': total
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to create order: {str(e)}'})
        }