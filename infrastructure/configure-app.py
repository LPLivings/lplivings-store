#!/usr/bin/env python3
"""
Interactive Configuration Script for E-Commerce App
This will help you set up all the configuration files step by step
"""

import json
import os
import sys

def main():
    print("🎯 E-Commerce App Configuration Wizard")
    print("=" * 50)
    print("")
    
    # Collect all the information
    config = {}
    
    print("📋 I'll help you configure your app. Please have ready:")
    print("   • Google OAuth Client ID")
    print("   • Google Spreadsheet ID") 
    print("   • Path to your service account JSON file")
    print("")
    
    # Google OAuth Client ID
    print("1️⃣  Enter your Google OAuth Client ID:")
    print("    (This is from Google Cloud Console > APIs & Services > Credentials)")
    config['google_client_id'] = input("    Client ID: ").strip()
    
    # Google Sheets ID
    print("\n2️⃣  Enter your Google Spreadsheet ID:")
    print("    (This is the long string in your Google Sheets URL)")
    config['google_sheets_id'] = input("    Spreadsheet ID: ").strip()
    
    # Service Account JSON
    print("\n3️⃣  Enter the path to your service account JSON file:")
    print("    (Example: ~/Downloads/ecommerce-sheets-service-*.json)")
    json_path = input("    JSON file path: ").strip()
    
    # Expand user path
    if json_path.startswith('~'):
        json_path = os.path.expanduser(json_path)
    
    # Read and validate JSON
    try:
        with open(json_path, 'r') as f:
            service_account = json.load(f)
        config['google_credentials'] = json.dumps(service_account)
        print(f"    ✅ Service account JSON loaded successfully!")
    except Exception as e:
        print(f"    ❌ Error reading JSON file: {e}")
        return
    
    print("\n🎯 Configuration Summary:")
    print("=" * 30)
    print(f"Google Client ID: {config['google_client_id'][:20]}...")
    print(f"Sheets ID: {config['google_sheets_id'][:20]}...")
    print(f"Service Account: {service_account.get('client_email', 'Unknown')}")
    
    print("\n📝 Creating configuration files...")
    
    # Create frontend .env
    frontend_env = f"""# Frontend Environment Variables
REACT_APP_GOOGLE_CLIENT_ID={config['google_client_id']}
REACT_APP_API_URL=http://localhost:3001
"""
    
    with open('../frontend/.env', 'w') as f:
        f.write(frontend_env)
    print("   ✅ Created frontend/.env")
    
    # Create backend env.json
    backend_env = {
        "Parameters": {
            "GOOGLE_CLIENT_ID": config['google_client_id'],
            "GOOGLE_SHEETS_ID": config['google_sheets_id'],
            "GOOGLE_CREDENTIALS": config['google_credentials'],
            "S3_BUCKET": "ecommerce-product-images-dev",
            "ENVIRONMENT": "dev"
        }
    }
    
    with open('../backend/env.json', 'w') as f:
        json.dump(backend_env, f, indent=2)
    print("   ✅ Created backend/env.json")
    
    # Create GitHub secrets template
    github_secrets = {
        "AWS_ACCESS_KEY_ID": "your-aws-access-key-id",
        "AWS_SECRET_ACCESS_KEY": "your-aws-secret-access-key", 
        "SAM_DEPLOYMENT_BUCKET": "your-s3-bucket-for-sam-deployments",
        "GOOGLE_CLIENT_ID": config['google_client_id'],
        "GOOGLE_SHEETS_ID": config['google_sheets_id'],
        "GOOGLE_CREDENTIALS": config['google_credentials']
    }
    
    with open('github-secrets-template.json', 'w') as f:
        json.dump(github_secrets, f, indent=2)
    print("   ✅ Created github-secrets-template.json")
    
    print("\n🎉 Configuration complete!")
    print("\n📋 Next steps:")
    print("1. Set up your Google Sheets structure:")
    print("   python setup-google-sheets.py")
    print("")
    print("2. Test your local development:")
    print("   cd ../frontend && npm start")
    print("   cd ../backend && sam local start-api --env-vars env.json")
    print("")
    print("3. Set up GitHub repository with the secrets from github-secrets-template.json")

if __name__ == "__main__":
    main()