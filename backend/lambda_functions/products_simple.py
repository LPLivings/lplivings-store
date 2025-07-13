import json

def lambda_handler(event, context):
    # Basic CORS headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }
    
    # Handle preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    # Return sample products for testing
    if event.get('httpMethod') == 'GET':
        sample_products = [
            {
                'id': 'demo-001',
                'name': 'Sample T-Shirt',
                'description': 'Comfortable cotton t-shirt',
                'price': 19.99,
                'category': 'Clothing',
                'image': 'https://via.placeholder.com/300x300/1976d2/white?text=T-Shirt'
            },
            {
                'id': 'demo-002',
                'name': 'Coffee Mug',
                'description': 'Ceramic coffee mug',
                'price': 12.99,
                'category': 'Kitchen',
                'image': 'https://via.placeholder.com/300x300/2e7d32/white?text=Mug'
            },
            {
                'id': 'demo-003',
                'name': 'Tech Book',
                'description': 'Learn programming basics',
                'price': 29.99,
                'category': 'Books',
                'image': 'https://via.placeholder.com/300x300/f57c00/white?text=Book'
            },
            {
                'id': 'demo-004',
                'name': 'Wireless Headphones',
                'description': 'High-quality wireless headphones',
                'price': 89.99,
                'category': 'Electronics',
                'image': 'https://via.placeholder.com/300x300/9c27b0/white?text=Headphones'
            }
        ]
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(sample_products)
        }
    
    # Handle POST requests (add product)
    if event.get('httpMethod') == 'POST':
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': 'new-product-id',
                'message': 'Product added successfully'
            })
        }
    
    # Method not allowed
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Method not allowed'})
    }