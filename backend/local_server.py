#!/usr/bin/env python3
"""
Simple Flask server for local development
This bypasses SAM/Docker issues and provides a direct API server
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Sample products data
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
    },
    {
        'id': 'demo-005',
        'name': 'Smart Watch',
        'description': 'Feature-rich smartwatch',
        'price': 199.99,
        'category': 'Electronics',
        'image': 'https://via.placeholder.com/300x300/e91e63/white?text=Watch'
    },
    {
        'id': 'demo-006',
        'name': 'Running Shoes',
        'description': 'Comfortable running shoes',
        'price': 79.99,
        'category': 'Sports',
        'image': 'https://via.placeholder.com/300x300/3f51b5/white?text=Shoes'
    }
]

@app.route('/products', methods=['GET', 'POST', 'OPTIONS'])
def products():
    if request.method == 'OPTIONS':
        return '', 200
        
    if request.method == 'GET':
        return jsonify(sample_products)
        
    if request.method == 'POST':
        data = request.get_json()
        new_product = {
            'id': f'user-{len(sample_products) + 1}',
            'name': data.get('name', 'New Product'),
            'description': data.get('description', ''),
            'price': float(data.get('price', 0)),
            'category': data.get('category', 'General'),
            'image': data.get('imageUrl', 'https://via.placeholder.com/300x300/607d8b/white?text=New+Product')
        }
        sample_products.append(new_product)
        return jsonify({'id': new_product['id'], 'message': 'Product added successfully'}), 201

@app.route('/auth', methods=['POST', 'OPTIONS'])
def auth():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    token = data.get('token')
    
    # Simple mock authentication
    user_info = {
        'id': 'user-123',
        'email': 'demo@example.com',
        'name': 'Demo User',
        'picture': 'https://via.placeholder.com/100x100/4caf50/white?text=User',
        'email_verified': True
    }
    
    return jsonify({
        'user': user_info,
        'token': token
    })

@app.route('/orders', methods=['GET', 'POST', 'OPTIONS'])
def orders():
    if request.method == 'OPTIONS':
        return '', 200
        
    if request.method == 'GET':
        return jsonify([])
        
    if request.method == 'POST':
        data = request.get_json()
        items = data.get('items', [])
        total = sum(item.get('price', 0) * item.get('quantity', 1) for item in items)
        
        return jsonify({
            'id': 'order-123',
            'message': 'Order created successfully',
            'total': total
        }), 201

@app.route('/upload-url', methods=['GET', 'OPTIONS'])
def upload_url():
    if request.method == 'OPTIONS':
        return '', 200
        
    # Mock upload URL for local development
    file_ext = request.args.get('ext', 'jpg')
    mock_key = f'uploads/product-{os.urandom(8).hex()}.{file_ext}'
    
    return jsonify({
        'uploadUrl': f'http://localhost:3002/mock-upload?key={mock_key}',
        'imageUrl': f'https://via.placeholder.com/400x400/1976d2/white?text=Uploaded+Image'
    })

@app.route('/mock-upload', methods=['PUT', 'OPTIONS'])
def mock_upload():
    if request.method == 'OPTIONS':
        return '', 200
    
    # Mock successful upload
    return '', 200

@app.route('/analyze-image', methods=['POST', 'OPTIONS'])
def analyze_image():
    if request.method == 'OPTIONS':
        return '', 200
        
    data = request.get_json()
    image_url = data.get('imageUrl', '')
    
    # Simulate processing time (minimal for mobile UX)
    import time
    time.sleep(0.1)  # Very fast for better mobile experience
    
    # Mock AI analysis response with more realistic food/product detection
    import random
    
    # Simulate smarter AI that detects different product types
    food_items = {
        'categories': ['Kitchen', 'Home & Garden', 'Health'],
        'descriptions': [
            'Fresh organic cucumber, perfect for salads and healthy cooking',
            'Premium quality vegetable, ideal for fresh consumption',
            'Crisp and refreshing cucumber, great for snacks and meals',
            'Natural organic produce, perfect for healthy lifestyle',
            'Fresh garden vegetable, excellent for culinary use'
        ],
        'names': ['Fresh Cucumber', 'Organic Cucumber', 'Garden Cucumber', 'Premium Cucumber']
    }
    
    electronics = {
        'categories': ['Electronics', 'Technology'],
        'descriptions': [
            'High-quality electronic device with modern features',
            'Advanced technology product for everyday use',
            'Premium electronics with excellent performance'
        ],
        'names': ['Smart Device', 'Tech Product', 'Electronic Item']
    }
    
    general_items = {
        'categories': ['General', 'Home & Garden', 'Lifestyle'],
        'descriptions': [
            'Quality product with excellent build materials',
            'Stylish and functional item perfect for everyday use',
            'Durable and reliable product with modern design'
        ],
        'names': ['Quality Product', 'Premium Item', 'Lifestyle Product']
    }
    
    # Randomly pick a product type to simulate AI detection
    product_types = [food_items, electronics, general_items]
    weights = [0.6, 0.2, 0.2]  # 60% chance of food detection for demo
    selected_type = random.choices(product_types, weights=weights)[0]
    
    return jsonify({
        'category': random.choice(selected_type['categories']),
        'description': random.choice(selected_type['descriptions']),
        'name': random.choice(selected_type['names']),
        'labels': ['product', 'food', 'vegetable'] if selected_type == food_items else ['product', 'commercial'],
        'confidence': round(random.uniform(0.85, 0.98), 2)
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Local development server running'})

if __name__ == '__main__':
    print("🚀 Starting local development server...")
    print("📡 API will be available at: http://localhost:3001")
    print("🔗 Endpoints:")
    print("   GET  /products - List products")
    print("   POST /products - Add product")
    print("   GET  /upload-url - Get upload URL")
    print("   POST /analyze-image - Analyze image")
    print("   POST /auth - Authenticate user")
    print("   GET  /orders - List orders")
    print("   POST /orders - Create order")
    print("   GET  /health - Health check")
    print("")
    app.run(host='127.0.0.1', port=3002, debug=True)