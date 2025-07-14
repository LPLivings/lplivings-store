import json
import boto3
import uuid
import base64
from datetime import datetime
import os
import urllib.parse

s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'ecommerce-product-images')

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

def get_products_from_s3():
    """Get products from S3 JSON file"""
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key='products/products.json')
        products_data = json.loads(response['Body'].read().decode('utf-8'))
        return products_data.get('products', [])
    except s3_client.exceptions.NoSuchKey:
        # File doesn't exist yet, return empty list
        return []
    except Exception as e:
        print(f"Error reading products from S3: {e}")
        return []

def save_products_to_s3(products):
    """Save products to S3 JSON file"""
    try:
        products_data = {'products': products, 'lastUpdated': datetime.now().isoformat()}
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key='products/products.json',
            Body=json.dumps(products_data, indent=2),
            ContentType='application/json'
        )
        return True
    except Exception as e:
        print(f"Error saving products to S3: {e}")
        return False

def get_products(headers):
    try:
        # Get products from S3
        products = get_products_from_s3()
        
        # If no products found, add default ones
        if not products:
            default_products = [
                {
                    'id': 'demo-001',
                    'name': 'Sample T-Shirt',
                    'description': 'Comfortable cotton t-shirt',
                    'price': 19.99,
                    'category': 'Clothing',
                    'image': 'https://picsum.photos/300/300?random=1',
                    'userId': 'demo',
                    'createdAt': datetime.now().isoformat()
                },
                {
                    'id': 'demo-002',
                    'name': 'Coffee Mug',
                    'description': 'Ceramic coffee mug',
                    'price': 12.99,
                    'category': 'Kitchen',
                    'image': 'https://picsum.photos/300/300?random=2',
                    'userId': 'demo',
                    'createdAt': datetime.now().isoformat()
                },
                {
                    'id': 'demo-003',
                    'name': 'Tech Book',
                    'description': 'Learn programming basics',
                    'price': 29.99,
                    'category': 'Books',
                    'image': 'https://picsum.photos/300/300?random=3',
                    'userId': 'demo',
                    'createdAt': datetime.now().isoformat()
                },
                {
                    'id': 'demo-004',
                    'name': 'Wireless Headphones',
                    'description': 'High-quality wireless headphones',
                    'price': 89.99,
                    'category': 'Electronics',
                    'image': 'https://picsum.photos/300/300?random=4',
                    'userId': 'demo',
                    'createdAt': datetime.now().isoformat()
                }
            ]
            save_products_to_s3(default_products)
            products = default_products
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(products)
        }
    except Exception as e:
        print(f"Error in get_products: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }

def parse_multipart_data(body, boundary):
    """Parse multipart form data"""
    parts = body.split(f'--{boundary}')
    fields = {}
    files = {}
    
    for part in parts:
        if 'Content-Disposition: form-data' in part:
            lines = part.strip().split('\r\n')
            header_line = lines[0]
            
            # Extract field name
            name_match = header_line.split('name="')[1].split('"')[0] if 'name="' in header_line else None
            if not name_match:
                continue
                
            # Check if it's a file
            if 'filename="' in header_line:
                filename = header_line.split('filename="')[1].split('"')[0]
                if filename:
                    # Find content type
                    content_type = 'application/octet-stream'
                    for line in lines:
                        if line.startswith('Content-Type:'):
                            content_type = line.split(':', 1)[1].strip()
                            break
                    
                    # Extract file data (after empty line)
                    data_start = False
                    file_data = []
                    for line in lines:
                        if data_start:
                            file_data.append(line)
                        elif line == '':
                            data_start = True
                    
                    if file_data:
                        files[name_match] = {
                            'filename': filename,
                            'content_type': content_type,
                            'data': '\r\n'.join(file_data).encode('latin1')
                        }
            else:
                # Regular field
                data_start = False
                field_data = []
                for line in lines:
                    if data_start:
                        field_data.append(line)
                    elif line == '':
                        data_start = True
                
                if field_data:
                    fields[name_match] = '\r\n'.join(field_data)
    
    return fields, files

def add_product(event, headers):
    try:
        product_id = str(uuid.uuid4())
        
        # Handle JSON requests (no file upload - use pre-signed URLs)
        content_type = event.get('headers', {}).get('content-type', '') or event.get('headers', {}).get('Content-Type', '')
        
        if 'application/json' in content_type or not content_type.startswith('multipart/'):
            body = json.loads(event['body']) if event.get('body') else {}
            name = body.get('name', '')
            description = body.get('description', '')
            price = body.get('price', '0')
            category = body.get('category', '')
            user_id = body.get('userId', '')
            image_url = body.get('imageUrl', '')  # Pre-uploaded via pre-signed URL
        elif 'multipart/form-data' in content_type:
            boundary = content_type.split('boundary=')[1] if 'boundary=' in content_type else None
            print(f"Boundary: {boundary}")
            if boundary:
                body = event['body']
                if event.get('isBase64Encoded'):
                    body = base64.b64decode(body).decode('latin1')
                
                fields, files = parse_multipart_data(body, boundary)
                print(f"Parsed fields: {fields}")
                print(f"Parsed files: {list(files.keys())}")
                
                # Extract form fields
                name = fields.get('name', '')
                description = fields.get('description', '')
                price = fields.get('price', '0')
                category = fields.get('category', '')
                user_id = fields.get('userId', '')
                
                print(f"Extracted values - name: {name}, description: {description}, price: {price}, category: {category}, userId: {user_id}")
                
                # Handle image upload
                image_url = ''
                if 'image' in files:
                    file_info = files['image']
                    image_key = f"products/{product_id}/{file_info['filename']}"
                    
                    s3_client.put_object(
                        Bucket=S3_BUCKET,
                        Key=image_key,
                        Body=file_info['data'],
                        ContentType=file_info['content_type']
                    )
                    image_url = f"https://{S3_BUCKET}.s3.amazonaws.com/{image_key}"
            else:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Invalid multipart boundary'})
                }
        else:
            # Fallback to JSON parsing
            body = json.loads(event['body'])
            name = body.get('name', '')
            description = body.get('description', '')
            price = body.get('price', '0')
            category = body.get('category', '')
            user_id = body.get('userId', '')
            image_url = ''
        
        # Add product to S3 storage
        try:
            # Get existing products
            existing_products = get_products_from_s3()
            
            # Create new product
            new_product = {
                'id': product_id,
                'name': name,
                'description': description,
                'price': float(price) if price.replace('.','').isdigit() else 0.0,
                'category': category,
                'image': image_url,
                'userId': user_id,
                'createdAt': datetime.now().isoformat()
            }
            
            # Add to list and save
            existing_products.append(new_product)
            save_products_to_s3(existing_products)
            
            print(f"Product {product_id} saved to S3 successfully")
            
        except Exception as storage_error:
            print(f"Failed to save product to S3: {storage_error}")
            # Continue anyway - at least we tried
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': product_id,
                'name': name,
                'image': image_url,
                'message': 'Product added successfully'
            })
        }
    except Exception as e:
        import traceback
        print(f"ERROR in add_product: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to add product: {str(e)}'})
        }