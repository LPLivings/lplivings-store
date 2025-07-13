import json
import boto3
import uuid
import os
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'ecommerce-product-images')

def lambda_handler(event, context):
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }
    
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Generate unique filename
        file_extension = event.get('queryStringParameters', {}).get('ext', 'jpg')
        filename = f"products/{str(uuid.uuid4())}.{file_extension}"
        
        # Generate pre-signed URL for upload
        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': S3_BUCKET,
                'Key': filename,
                'ContentType': f'image/{file_extension}'
            },
            ExpiresIn=300  # 5 minutes
        )
        
        # Return pre-signed URL and final image URL
        image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'uploadUrl': presigned_url,
                'imageUrl': image_url,
                'filename': filename
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to generate upload URL: {str(e)}'})
        }