#!/usr/bin/env python3
"""
Simple Flask server for local development
This bypasses SAM/Docker issues and provides a direct API server
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os

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
            'image': 'https://via.placeholder.com/300x300/607d8b/white?text=New+Product'
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

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'Local development server running'})

if __name__ == '__main__':
    print("🚀 Starting local development server...")
    print("📡 API will be available at: http://localhost:3001")
    print("🔗 Endpoints:")
    print("   GET  /products - List products")
    print("   POST /products - Add product")
    print("   POST /auth - Authenticate user")
    print("   GET  /orders - List orders")
    print("   POST /orders - Create order")
    print("   GET  /health - Health check")
    print("")
    app.run(host='127.0.0.1', port=3002, debug=True)