import json
import pytest
import os
from unittest.mock import patch, MagicMock
import sys

# Add the lambda_functions directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'lambda_functions'))

from auth import lambda_handler


class TestAuthHandler:
    
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
    
    def test_missing_token(self):
        """Test request without token"""
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({})
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 400
        body = json.loads(response['body'])
        assert 'error' in body
        assert body['error'] == 'Token is required'
    
    @patch('auth.id_token.verify_oauth2_token')
    @patch.dict(os.environ, {'GOOGLE_CLIENT_ID': 'test-client-id'})
    def test_valid_token(self, mock_verify_token):
        """Test valid Google OAuth token"""
        mock_verify_token.return_value = {
            'sub': 'test-user-id',
            'email': 'test@example.com',
            'name': 'Test User',
            'picture': 'https://example.com/picture.jpg',
            'email_verified': True
        }
        
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'token': 'valid-test-token'})
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 200
        body = json.loads(response['body'])
        assert 'user' in body
        assert 'token' in body
        assert body['user']['email'] == 'test@example.com'
        assert body['user']['name'] == 'Test User'
    
    @patch('auth.id_token.verify_oauth2_token')
    @patch.dict(os.environ, {'GOOGLE_CLIENT_ID': 'test-client-id'})
    def test_invalid_token(self, mock_verify_token):
        """Test invalid Google OAuth token"""
        mock_verify_token.side_effect = ValueError('Invalid token')
        
        event = {
            'httpMethod': 'POST',
            'body': json.dumps({'token': 'invalid-test-token'})
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body
        assert body['error'] == 'Invalid token'
    
    def test_malformed_json(self):
        """Test request with malformed JSON"""
        event = {
            'httpMethod': 'POST',
            'body': 'invalid-json'
        }
        context = {}
        
        response = lambda_handler(event, context)
        
        # The auth handler actually catches JSON decode errors and returns 401 for missing token
        assert response['statusCode'] == 401
        body = json.loads(response['body'])
        assert 'error' in body