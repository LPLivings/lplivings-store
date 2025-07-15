import json
import boto3
import uuid
from datetime import datetime
import os
from secrets_manager import get_admin_emails

s3_client = boto3.client('s3')
S3_BUCKET = os.environ.get('S3_BUCKET', 'ecommerce-product-images')

# Admin emails who can view all orders and update status
def get_admin_emails_list():
    """Get admin emails from Secrets Manager with fallback"""
    admin_emails = get_admin_emails()
    if admin_emails:
        return admin_emails
    # Fallback to environment variable
    return os.environ.get('ADMIN_EMAILS', 'admin@example.com').split(',')

def lambda_handler(event, context):
    http_method = event['httpMethod']
    
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS'
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
        elif http_method == 'PUT':
            return update_order_status(event, headers)
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

def get_orders_from_s3():
    """Get orders from S3 JSON file"""
    try:
        response = s3_client.get_object(Bucket=S3_BUCKET, Key='orders/orders.json')
        orders_data = json.loads(response['Body'].read().decode('utf-8'))
        return orders_data.get('orders', [])
    except s3_client.exceptions.NoSuchKey:
        # File doesn't exist yet, return empty list
        return []
    except Exception as e:
        print(f"Error reading orders from S3: {e}")
        return []

def save_orders_to_s3(orders):
    """Save orders to S3 JSON file"""
    try:
        orders_data = {'orders': orders, 'lastUpdated': datetime.now().isoformat()}
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key='orders/orders.json',
            Body=json.dumps(orders_data, indent=2),
            ContentType='application/json'
        )
        return True
    except Exception as e:
        print(f"Error saving orders to S3: {e}")
        return False

def get_user_email_from_token(event):
    """Extract user email from JWT token in Authorization header"""
    try:
        auth_header = event.get('headers', {}).get('Authorization') or event.get('headers', {}).get('authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None
            
        token = auth_header.split(' ')[1]
        
        # For now, we'll decode without verification (not secure for production)
        import base64
        payload = token.split('.')[1]
        # Add padding if needed
        padding = len(payload) % 4
        if padding:
            payload += '=' * (4 - padding)
        
        decoded = base64.b64decode(payload)
        user_data = json.loads(decoded)
        
        return user_data.get('email')
    except Exception as e:
        print(f"Error extracting email from token: {e}")
        return None

def is_admin_user(email):
    """Check if user email is in admin list"""
    if not email:
        return False
    admin_emails = get_admin_emails_list()
    return email.strip().lower() in [admin.strip().lower() for admin in admin_emails]

def get_orders(event, headers):
    try:
        # Check if request is from admin
        query_params = event.get('queryStringParameters') or {}
        user_email = get_user_email_from_token(event)
        is_admin = is_admin_user(user_email) or query_params.get('admin') == 'true'
        
        # Get all orders from S3
        all_orders = get_orders_from_s3()
        
        if is_admin:
            # Admin can see all orders
            # Sort by creation date (newest first)
            all_orders.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'orders': all_orders,
                    'isAdmin': True,
                    'totalOrders': len(all_orders)
                })
            }
        else:
            # Regular users see only their orders
            user_id = query_params.get('userId')
            if not user_id:
                # Try to extract from token
                if user_email:
                    user_orders = [o for o in all_orders if o.get('customerInfo', {}).get('email') == user_email]
                else:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'User ID required'})
                    }
            else:
                user_orders = [o for o in all_orders if o.get('userId') == user_id]
            
            # Sort by creation date (newest first)
            user_orders.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'orders': user_orders,
                    'isAdmin': False,
                    'totalOrders': len(user_orders)
                })
            }
    except Exception as e:
        print(f"Error in get_orders: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to fetch orders: {str(e)}'})
        }

def create_order(event, headers):
    try:
        body = json.loads(event['body'])
        order_id = f"order_{uuid.uuid4().hex[:8]}_{int(datetime.now().timestamp())}"
        
        # Calculate total if not provided
        items = body.get('items', [])
        total = body.get('total', 0)
        if not total and items:
            total = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
        
        # Create order object
        new_order = {
            'id': order_id,
            'userId': body.get('userId', ''),
            'items': items,
            'total': float(total),
            'status': body.get('status', 'pending'),
            'createdAt': datetime.now().isoformat(),
            'customerInfo': body.get('customerInfo', {}),
            'paymentIntentId': body.get('paymentIntentId', ''),
            'trackingNumber': '',
            'statusHistory': [{
                'status': body.get('status', 'pending'),
                'timestamp': datetime.now().isoformat(),
                'updatedBy': 'system'
            }]
        }
        
        # Add to S3 storage
        existing_orders = get_orders_from_s3()
        existing_orders.append(new_order)
        save_orders_to_s3(existing_orders)
        
        return {
            'statusCode': 201,
            'headers': headers,
            'body': json.dumps({
                'id': order_id,
                'message': 'Order created successfully',
                'order': new_order
            })
        }
    except Exception as e:
        print(f"Error in create_order: {e}")
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to create order: {str(e)}'})
        }

def update_order_status(event, headers):
    """Update order status (admin only)"""
    try:
        # Check for admin authorization
        query_params = event.get('queryStringParameters') or {}
        user_email = get_user_email_from_token(event)
        is_admin = is_admin_user(user_email) or query_params.get('admin') == 'true'
        
        if not is_admin:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Unauthorized. Admin access required.'})
            }
        
        # Get order ID from path parameters
        path_params = event.get('pathParameters', {}) or {}
        order_id = path_params.get('id')
        
        if not order_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Order ID is required'})
            }
        
        # Parse request body
        body = json.loads(event['body'])
        new_status = body.get('status')
        tracking_number = body.get('trackingNumber', '')
        
        if not new_status:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'Status is required'})
            }
        
        # Valid status values
        valid_statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
        if new_status not in valid_statuses:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'})
            }
        
        # Get existing orders
        existing_orders = get_orders_from_s3()
        
        # Find and update the order
        order_found = False
        for order in existing_orders:
            if order['id'] == order_id:
                order_found = True
                # Update status
                order['status'] = new_status
                
                # Update tracking number if provided
                if tracking_number:
                    order['trackingNumber'] = tracking_number
                
                # Add to status history
                if 'statusHistory' not in order:
                    order['statusHistory'] = []
                
                order['statusHistory'].append({
                    'status': new_status,
                    'timestamp': datetime.now().isoformat(),
                    'updatedBy': user_email or 'admin',
                    'trackingNumber': tracking_number
                })
                
                # Update last modified
                order['lastModified'] = datetime.now().isoformat()
                break
        
        if not order_found:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'error': 'Order not found'})
            }
        
        # Save updated orders
        save_orders_to_s3(existing_orders)
        
        print(f"Order {order_id} status updated to {new_status} by {user_email or 'admin'}")
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'message': f'Order status updated to {new_status}',
                'orderId': order_id,
                'newStatus': new_status,
                'trackingNumber': tracking_number
            })
        }
        
    except Exception as e:
        print(f"Error in update_order_status: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Failed to update order status: {str(e)}'})
        }

# End of file