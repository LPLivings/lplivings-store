#!/usr/bin/env python3
"""
Simple Google Sheets Setup Script
Run this after creating your spreadsheet and service account
"""

import json
import sys

print("=== Google Sheets Setup Helper ===\n")

# Check if user provided the JSON file
if len(sys.argv) != 2:
    print("Usage: python simple-sheets-setup.py <path-to-service-account.json>")
    print("\nExample: python simple-sheets-setup.py ~/Downloads/google-service-account.json")
    sys.exit(1)

json_path = sys.argv[1]

# Read and validate the JSON
try:
    with open(json_path, 'r') as f:
        creds = json.load(f)
    
    client_email = creds.get('client_email', 'Not found')
    project_id = creds.get('project_id', 'Not found')
    
    print("✅ Service Account JSON loaded successfully!")
    print(f"📧 Service Account Email: {client_email}")
    print(f"🏷️  Project ID: {project_id}")
    
except Exception as e:
    print(f"❌ Error reading JSON file: {e}")
    sys.exit(1)

print("\n=== Next Steps ===\n")

print("1. Create a new Google Spreadsheet (if not done already)")
print("   👉 Go to: https://sheets.google.com")
print("   👉 Create a new blank spreadsheet")
print("   👉 Name it: 'E-Commerce App Data'\n")

print("2. Share the spreadsheet with your service account:")
print(f"   👉 Click 'Share' button")
print(f"   👉 Add this email: {client_email}")
print(f"   👉 Give 'Editor' access")
print(f"   👉 Uncheck 'Notify people'")
print(f"   👉 Click 'Share'\n")

print("3. Get your Spreadsheet ID:")
print("   👉 Look at the spreadsheet URL")
print("   👉 Copy the ID between '/d/' and '/edit'")
print("   👉 Example: https://docs.google.com/spreadsheets/d/YOUR_ID_HERE/edit\n")

print("4. Install required Python packages:")
print("   👉 pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client\n")

print("5. Save these values - you'll need them later:")
print(f"   📋 Service Account Email: {client_email}")
print(f"   📄 Service Account JSON: Keep the file '{json_path}' safe")
print("   🆔 Spreadsheet ID: (from step 3)")
print("   🔑 OAuth Client ID: (from Google Cloud Console)\n")

# Create a template for environment variables
env_template = {
    "GOOGLE_CLIENT_ID": "your-oauth-client-id-here",
    "GOOGLE_SHEETS_ID": "your-spreadsheet-id-here",
    "GOOGLE_SERVICE_ACCOUNT_EMAIL": client_email,
    "Note": "Keep your service account JSON file safe - you'll need it for deployment"
}

with open('google-config-template.json', 'w') as f:
    json.dump(env_template, f, indent=2)

print("📝 Created 'google-config-template.json' - fill this out with your values")
print("\n✅ Setup validation complete!")