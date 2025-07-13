import json
import os
from google.oauth2 import id_token
from google.auth.transport import requests

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
        body = json.loads(event['body'])
        token = body.get('token')
        
        if not token:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Token is required'})
            }
        
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            os.environ.get('GOOGLE_CLIENT_ID')
        )
        
        # Extract user information
        user_info = {
            'id': idinfo['sub'],
            'email': idinfo['email'],
            'name': idinfo.get('name', ''),
            'picture': idinfo.get('picture', ''),
            'email_verified': idinfo.get('email_verified', False)
        }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'user': user_info,
                'token': token
            })
        }
    except ValueError as e:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Invalid token'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }