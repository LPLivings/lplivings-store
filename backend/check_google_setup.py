#!/usr/bin/env python3
import json
import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Load environment
with open('env.json', 'r') as f:
    env = json.load(f)['Parameters']

os.environ.update(env)

try:
    google_creds = os.environ.get('GOOGLE_CREDENTIALS', '{}')
    credentials = service_account.Credentials.from_service_account_info(
        json.loads(google_creds),
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    service = build('sheets', 'v4', credentials=credentials)
    
    # Get sheet metadata
    sheet_metadata = service.spreadsheets().get(spreadsheetId=os.environ.get('GOOGLE_SHEETS_ID')).execute()
    print('📊 Current Google Sheet Status:')
    print(f'Sheet Title: {sheet_metadata["properties"]["title"]}')
    print(f'Sheet URL: https://docs.google.com/spreadsheets/d/{os.environ.get("GOOGLE_SHEETS_ID")}')
    
    # Check all sheets
    sheets = sheet_metadata.get('sheets', '')
    for sheet in sheets:
        sheet_title = sheet['properties']['title']
        print(f'\n📋 Sheet: {sheet_title}')
        
        # Get the data
        result = service.spreadsheets().values().get(
            spreadsheetId=os.environ.get('GOOGLE_SHEETS_ID'),
            range=f'{sheet_title}!A1:H10'
        ).execute()
        
        values = result.get('values', [])
        if values:
            print(f'  ✅ Headers (Row 1): {values[0] if len(values) > 0 else "No headers"}')
            print(f'  📊 Data rows: {len(values) - 1 if len(values) > 1 else 0}')
            
            if len(values) > 1:
                print('  📝 Sample data:')
                for i, row in enumerate(values[1:6]):  # Show first 5 data rows
                    print(f'    Row {i+2}: {row}')
        else:
            print('  ❌ No data found')
    
    print('\n🔧 Credentials Test:')
    print(f'✅ Service Account Email: {json.loads(google_creds)["client_email"]}')
    print(f'✅ Project ID: {json.loads(google_creds)["project_id"]}')
    print(f'✅ Google Sheets ID: {os.environ.get("GOOGLE_SHEETS_ID")}')
    
except Exception as e:
    print(f'❌ Error: {e}')
    import traceback
    traceback.print_exc()