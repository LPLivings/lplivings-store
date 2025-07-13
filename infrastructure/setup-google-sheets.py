#!/usr/bin/env python3
"""
Google Sheets Structure Setup
Run this after you've configured your app with configure-app.py
"""

import json
import os
import sys

def setup_sheets():
    print("📊 Setting up Google Sheets structure...")
    
    # Load configuration
    env_file = '../backend/env.json'
    if not os.path.exists(env_file):
        print("❌ Backend env.json not found!")
        print("   Please run configure-app.py first")
        return
    
    with open(env_file, 'r') as f:
        config = json.load(f)
    
    sheets_id = config['Parameters']['GOOGLE_SHEETS_ID']
    credentials_json = json.loads(config['Parameters']['GOOGLE_CREDENTIALS'])
    
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
    except ImportError:
        print("❌ Google APIs not installed!")
        print("   Please run: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        return
    
    # Create credentials
    credentials = service_account.Credentials.from_service_account_info(
        credentials_json,
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    
    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()
    
    print(f"🔗 Connected to spreadsheet: {sheets_id}")
    
    # Try to create sheets (they might already exist)
    try:
        requests = [
            {
                'addSheet': {
                    'properties': {
                        'title': 'Products',
                        'gridProperties': {'rowCount': 1000, 'columnCount': 10}
                    }
                }
            },
            {
                'addSheet': {
                    'properties': {
                        'title': 'Orders', 
                        'gridProperties': {'rowCount': 1000, 'columnCount': 10}
                    }
                }
            }
        ]
        
        sheet.batchUpdate(
            spreadsheetId=sheets_id,
            body={'requests': requests}
        ).execute()
        print("   ✅ Created Products and Orders sheets")
    except Exception as e:
        print("   ℹ️  Sheets might already exist (this is OK)")
    
    # Add headers to Products sheet
    products_headers = [
        ['ID', 'Name', 'Description', 'Price', 'Category', 'Image URL', 'User ID', 'Created At']
    ]
    
    sheet.values().update(
        spreadsheetId=sheets_id,
        range='Products!A1:H1',
        valueInputOption='RAW',
        body={'values': products_headers}
    ).execute()
    print("   ✅ Added Products headers")
    
    # Add headers to Orders sheet
    orders_headers = [
        ['ID', 'User ID', 'Items (JSON)', 'Total', 'Status', 'Created At']
    ]
    
    sheet.values().update(
        spreadsheetId=sheets_id,
        range='Orders!A1:F1', 
        valueInputOption='RAW',
        body={'values': orders_headers}
    ).execute()
    print("   ✅ Added Orders headers")
    
    # Add sample data
    sample_products = [
        ['demo-001', 'Sample T-Shirt', 'Comfortable cotton t-shirt', '19.99', 'Clothing', 'https://via.placeholder.com/300x300?text=T-Shirt', 'demo-user', '2024-01-01T00:00:00Z'],
        ['demo-002', 'Coffee Mug', 'Ceramic coffee mug', '12.99', 'Kitchen', 'https://via.placeholder.com/300x300?text=Mug', 'demo-user', '2024-01-01T00:00:00Z'],
        ['demo-003', 'Tech Book', 'Learn programming', '29.99', 'Books', 'https://via.placeholder.com/300x300?text=Book', 'demo-user', '2024-01-01T00:00:00Z']
    ]
    
    sheet.values().append(
        spreadsheetId=sheets_id,
        range='Products!A:H',
        valueInputOption='RAW',
        body={'values': sample_products}
    ).execute()
    print("   ✅ Added sample products")
    
    # Format headers
    format_requests = [
        {
            'repeatCell': {
                'range': {
                    'sheetId': 0,
                    'startRowIndex': 0,
                    'endRowIndex': 1
                },
                'cell': {
                    'userEnteredFormat': {
                        'backgroundColor': {'red': 0.2, 'green': 0.4, 'blue': 0.8},
                        'textFormat': {
                            'foregroundColor': {'red': 1.0, 'green': 1.0, 'blue': 1.0},
                            'bold': True
                        }
                    }
                },
                'fields': 'userEnteredFormat(backgroundColor,textFormat)'
            }
        }
    ]
    
    sheet.batchUpdate(
        spreadsheetId=sheets_id,
        body={'requests': format_requests}
    ).execute()
    print("   ✅ Formatted headers")
    
    print("\n🎉 Google Sheets setup complete!")
    print(f"\n📊 Your spreadsheet: https://docs.google.com/spreadsheets/d/{sheets_id}")

if __name__ == "__main__":
    setup_sheets()