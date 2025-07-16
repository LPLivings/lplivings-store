import json
import boto3
import os
from botocore.exceptions import ClientError

class SecretsManager:
    def __init__(self, region='us-east-1'):
        self.region = region
        self.client = boto3.client('secretsmanager', region_name=region)
        self.environment = os.environ.get('ENVIRONMENT', 'dev')
        self.cache = {}
    
    def get_secret(self, secret_key):
        """Get secret from AWS Secrets Manager with caching"""
        
        # Check cache first
        if secret_key in self.cache:
            return self.cache[secret_key]
        
        secret_name = f"lplivings-store/{self.environment}/{secret_key}"
        
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            secret_value = response['SecretString']
            
            # Cache the value
            self.cache[secret_key] = secret_value
            return secret_value
            
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == 'ResourceNotFoundException':
                print(f"Secret {secret_name} not found")
                return None
            elif error_code == 'InvalidRequestException':
                print(f"Invalid request for secret {secret_name}")
                return None
            elif error_code == 'InvalidParameterException':
                print(f"Invalid parameter for secret {secret_name}")
                return None
            elif error_code == 'DecryptionFailure':
                print(f"Decryption failure for secret {secret_name}")
                return None
            else:
                print(f"Error retrieving secret {secret_name}: {str(e)}")
                return None
        except Exception as e:
            print(f"Unexpected error retrieving secret {secret_name}: {str(e)}")
            return None
    
    def get_stripe_secret_key(self):
        """Get Stripe secret key"""
        return self.get_secret('stripe-secret-key')
    
    def get_stripe_publishable_key(self):
        """Get Stripe publishable key"""
        return self.get_secret('stripe-publishable-key')
    
    def get_google_client_id(self):
        """Get Google client ID"""
        return self.get_secret('google-client-id')
    
    def get_google_sheets_id(self):
        """Get Google Sheets ID"""
        return self.get_secret('google-sheets-id')
    
    def get_google_credentials(self):
        """Get Google service account credentials"""
        credentials_json = self.get_secret('google-credentials')
        if credentials_json:
            try:
                return json.loads(credentials_json)
            except json.JSONDecodeError:
                print("Error: Google credentials is not valid JSON")
                return None
        return None
    
    def get_admin_emails(self):
        """Get admin emails list"""
        emails_str = self.get_secret('admin-emails')
        if emails_str:
            return [email.strip() for email in emails_str.split(',')]
        return []

# Global instance for easy use
secrets_manager = SecretsManager()

# Helper functions for backward compatibility
def get_stripe_secret_key():
    return secrets_manager.get_stripe_secret_key()

def get_stripe_publishable_key():
    return secrets_manager.get_stripe_publishable_key()

def get_google_client_id():
    return secrets_manager.get_google_client_id()

def get_google_sheets_id():
    return secrets_manager.get_google_sheets_id()

def get_google_credentials():
    return secrets_manager.get_google_credentials()

def get_admin_emails():
    return secrets_manager.get_admin_emails()