# Deployment Guide

This guide walks you through deploying the e-commerce application to AWS.

## Prerequisites

1. AWS Account with appropriate permissions
2. Google Cloud account with Sheets API enabled
3. GitHub repository with secrets configured
4. AWS CLI and SAM CLI installed locally

## Setup Steps

### 1. Google Setup

#### Create Google OAuth 2.0 Client
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized JavaScript origins: 
     - `http://localhost:3000` (development)
     - Your Amplify URL (production)
   - Note the Client ID

#### Create Service Account
1. In Google Cloud Console, go to Service Accounts
2. Create a new service account
3. Download the JSON key file
4. Enable Google Sheets API for the service account

#### Setup Google Sheets
1. Create a new Google Spreadsheet
2. Note the Spreadsheet ID from the URL
3. Share the spreadsheet with the service account email
4. Run the setup script:
   ```bash
   python infrastructure/setup-google-sheets.py <SPREADSHEET_ID> <path/to/service-account-key.json>
   ```

### 2. AWS Setup

#### Create S3 Bucket for SAM deployments
```bash
aws s3 mb s3://your-sam-deployment-bucket --region us-east-1
```

#### Create IAM User for GitHub Actions
Create an IAM user with the following policies:
- CloudFormationFullAccess
- IAMFullAccess
- S3FullAccess
- LambdaFullAccess
- APIGatewayAdministrator
- AmplifyFullAccess

### 3. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

- `AWS_ACCESS_KEY_ID`: IAM user access key
- `AWS_SECRET_ACCESS_KEY`: IAM user secret key
- `SAM_DEPLOYMENT_BUCKET`: S3 bucket name for SAM deployments
- `GOOGLE_CLIENT_ID`: OAuth 2.0 client ID
- `GOOGLE_SHEETS_ID`: Google Spreadsheet ID
- `GOOGLE_CREDENTIALS`: Service account JSON (stringify the entire JSON)

### 4. Local Development

#### Frontend
```bash
cd frontend
cp .env.example .env
# Edit .env with your values
npm install
npm start
```

#### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt

# Test locally with SAM
sam build
sam local start-api --env-vars env.json
```

Create `backend/env.json`:
```json
{
  "Parameters": {
    "GOOGLE_CLIENT_ID": "your-client-id",
    "GOOGLE_SHEETS_ID": "your-sheets-id",
    "GOOGLE_CREDENTIALS": "{\"type\": \"service_account\", ...}",
    "S3_BUCKET": "ecommerce-product-images-dev"
  }
}
```

### 5. Deployment

#### Manual Deployment
```bash
# Backend
cd backend
sam build
sam deploy --guided

# Frontend
cd frontend
npm run build
# Deploy to Amplify manually or use AWS CLI
```

#### Automated Deployment
Push to GitHub branches:
- `dev` branch → Development environment
- `main` branch → Production environment

The GitHub Actions workflow will automatically:
1. Build and deploy Lambda functions
2. Create/update API Gateway
3. Build React app with correct API URL
4. Deploy to AWS Amplify

### 6. Post-Deployment

1. **Configure Amplify Domain**:
   - Go to AWS Amplify Console
   - Set up custom domain if needed
   - Update Google OAuth redirect URIs

2. **Test the Application**:
   - Visit your Amplify URL
   - Test Google login
   - Add a product
   - Check Google Sheets for data

3. **Monitor**:
   - CloudWatch Logs for Lambda functions
   - API Gateway metrics
   - Amplify build logs

## Troubleshooting

### Google Authentication Issues
- Verify OAuth client ID in both frontend and backend
- Check authorized origins in Google Console
- Ensure redirect URIs match your deployment URL

### API Connection Issues
- Check CORS configuration in API Gateway
- Verify environment variables in Lambda
- Check CloudWatch logs for errors

### Google Sheets Issues
- Verify service account has access to spreadsheet
- Check credentials JSON is properly formatted
- Ensure Sheets API is enabled

## Security Notes

1. Never commit credentials to version control
2. Use IAM roles with least privilege
3. Enable CloudTrail for audit logging
4. Regularly rotate access keys
5. Use AWS Secrets Manager for production