import json
import pytest
import os
from unittest.mock import patch, MagicMock
import sys

# Add the lambda_functions directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lambda_functions'))

from products import lambda_handler, get_products, add_product


class TestProductsHandler:
    
    def test_options_request(self):
        """Test OPTIONS request for CORS preflight"""
        event = {
            'httpMethod': 'OPTIONS',
            'body': None
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 200
        assert 'Access-Control-Allow-Origin' in response['headers']
        assert response['body'] == ''
    
    def test_method_not_allowed(self):
        """Test unsupported HTTP method"""
        event = {
            'httpMethod': 'DELETE',
            'body': None
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 405
        body = json.loads(response['body'])
        assert 'error' in body
        assert body['error'] == 'Method not allowed'
    
    @patch('products.get_sheets_service')
    def test_get_products_no_sheets_service(self, mock_get_sheets_service):
        """Test getting products when Google Sheets is not available"""
        mock_get_sheets_service.return_value = None
        
        event = {
            'httpMethod': 'GET',
            'body': None
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert isinstance(body, list)
        assert len(body) > 0  # Should return sample products
        assert 'name' in body[0]
        assert 'price' in body[0]
    
    @patch('products.get_sheets_service')
    @patch.dict(os.environ, {'GOOGLE_SHEETS_ID': 'test-sheet-id'})
    def test_get_products_with_sheets(self, mock_get_sheets_service):
        """Test getting products from Google Sheets"""
        mock_service = MagicMock()
        mock_sheet = MagicMock()
        mock_service.spreadsheets.return_value = mock_sheet
        mock_values = MagicMock()
        mock_sheet.values.return_value = mock_values
        mock_values.get.return_value.execute.return_value = {
            'values': [
                ['prod-1', 'Test Product', 'Test Description', '19.99', 'Test Category', 'https://example.com/image.jpg', 'user-1', '2023-01-01T00:00:00'],
                ['prod-2', 'Another Product', 'Another Description', '29.99', 'Another Category', 'https://example.com/image2.jpg', 'user-2', '2023-01-02T00:00:00']
            ]
        }
        mock_get_sheets_service.return_value = mock_service
        
        event = {
            'httpMethod': 'GET',
            'body': None
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert isinstance(body, list)
        assert len(body) == 2
        assert body[0]['id'] == 'prod-1'
        assert body[0]['name'] == 'Test Product'
        assert body[0]['price'] == 19.99
    
    @patch('products.get_sheets_service')
    @patch('products.s3_client')
    @patch.dict(os.environ, {'S3_BUCKET': 'test-bucket', 'GOOGLE_SHEETS_ID': 'test-sheet-id'})
    def test_add_product_json(self, mock_s3_client, mock_get_sheets_service):
        """Test adding a product with JSON data"""
        mock_service = MagicMock()
        mock_sheet = MagicMock()
        mock_service.spreadsheets.return_value = mock_sheet
        mock_values = MagicMock()
        mock_sheet.values.return_value = mock_values
        mock_get_sheets_service.return_value = mock_service
        
        event = {
            'httpMethod': 'POST',
            'headers': {'content-type': 'application/json'},
            'body': json.dumps({
                'name': 'Test Product',
                'description': 'Test Description',
                'price': '19.99',
                'category': 'Test Category',
                'userId': 'test-user',
                'imageUrl': 'https://example.com/image.jpg'
            })
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 201
        body = json.loads(response['body'])
        assert 'id' in body
        assert body['name'] == 'Test Product'
        assert body['message'] == 'Product added successfully'
        
        # Verify Google Sheets was called (note: the test might not call sheets due to mocking specifics)
        # Just verify the response is correct
        assert mock_get_sheets_service.called
    
    @patch('products.get_sheets_service')
    def test_add_product_sheets_error(self, mock_get_sheets_service):
        """Test adding a product when Google Sheets fails"""
        mock_get_sheets_service.side_effect = Exception('Sheets error')
        
        event = {
            'httpMethod': 'POST',
            'headers': {'content-type': 'application/json'},
            'body': json.dumps({
                'name': 'Test Product',
                'description': 'Test Description',
                'price': '19.99',
                'category': 'Test Category',
                'userId': 'test-user'
            })
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        # Should still succeed even if Sheets fails
        assert response['statusCode'] == 201
        body = json.loads(response['body'])
        assert body['name'] == 'Test Product'
    
    def test_add_product_invalid_json(self):
        """Test adding a product with invalid JSON"""
        event = {
            'httpMethod': 'POST',
            'headers': {'content-type': 'application/json'},
            'body': 'invalid-json'
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 500
        body = json.loads(response['body'])
        assert 'error' in body