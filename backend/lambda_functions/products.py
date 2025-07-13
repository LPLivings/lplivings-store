import json
import boto3
import uuid
from datetime import datetime
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'ecommerce-product-images')
GOOGLE_SHEETS_ID = os.environ.get('GOOGLE_SHEETS_ID', '')

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
            return get_products(headers)
        elif http_method == 'POST':
            return add_product(event, headers)
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

def get_products(headers):
    try:
        service = get_sheets_service()
        sheet = service.spreadsheets()
        
        result = sheet.values().get(
            spreadsheetId=GOOGLE_SHEETS_ID,
            range='Products!A2:G'
        ).execute()
        
        values = result.get('values', [])
        products = []
        
        for row in values:
            if len(row) >= 6:
                products.append({
                    'id': row[0],
                    'name': row[1],
                    'description': row[2],
                    'price': float(row[3]),
                    'category': row[4],
                    'image': row[5],
                    'userId': row[6] if len(row) > 6 else None
                })
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(products)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to fetch products: {str(e)}'})
        }

def add_product(event, headers):
    try:
        body = json.loads(event['body'])
        product_id = str(uuid.uuid4())
        
        # Handle image upload if present
        image_url = ''
        if 'image' in body:
            image_data = body['image']
            image_key = f"products/{product_id}/image.jpg"
            s3_client.put_object(
                Bucket=S3_BUCKET,
                Key=image_key,
                Body=image_data,
                ContentType='image/jpeg'
            )
            image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{image_key}"
        
        # Add product to Google Sheets
        service = get_sheets_service()
        sheet = service.spreadsheets()
        
        values = [[
            product_id,
            body['name'],
            body.get('description', ''),
            body['price'],
            body.get('category', ''),
            image_url,
            body.get('userId', ''),
            datetime.now().isoformat()
        ]]
        
        sheet.values().append(
            spreadsheetId=GOOGLE_SHEETS_ID,
            range='Products!A:H',
            valueInputOption='RAW',
            body={'values': values}
        ).execute()
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': product_id,
                'message': 'Product added successfully'
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to add product: {str(e)}'})
        }