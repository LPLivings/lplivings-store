# GitHub Secrets Setup Guide

This document explains how to set up the required GitHub secrets for automated deployment.

## Required Secrets for Development Environment

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### AWS Credentials
1. **AWS_ACCESS_KEY_ID**
   - Description: AWS Access Key for deployment
   - Value: Your AWS Access Key ID with permissions for CloudFormation, S3, Lambda, API Gateway

2. **AWS_SECRET_ACCESS_KEY**
   - Description: AWS Secret Access Key for deployment
   - Value: Your AWS Secret Access Key

3. **SAM_DEPLOYMENT_BUCKET**
   - Description: S3 bucket for SAM deployment artifacts
   - Value: Name of existing S3 bucket (e.g., "lplivings-sam-deployment-bucket")
   - Note: This bucket must exist in your AWS account

### Google Integration
4. **GOOGLE_CLIENT_ID**
   - Description: Google OAuth Client ID
   - Value: Your Google OAuth 2.0 Client ID
   - Format: `123456789-abcdefghijklmnop.apps.googleusercontent.com`

5. **GOOGLE_SHEETS_ID**
   - Description: Google Sheets ID for data storage
   - Value: The ID from your Google Sheet URL
   - Format: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

6. **GOOGLE_CREDENTIALS**
   - Description: Google Service Account JSON credentials
   - Value: Complete JSON object from Google Service Account key file
   - Format: 
   ```json
   {
     "type": "service_account",
     "project_id": "your-project-id",
     "private_key_id": "key-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "service-account@project.iam.gserviceaccount.com",
     "client_id": "123456789",
     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
     "token_uri": "https://oauth2.googleapis.com/token",
     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
     "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/service-account%40project.iam.gserviceaccount.com"
   }
   ```

### Payment Processing (Optional for MVP)
7. **STRIPE_SECRET_KEY**
   - Description: Stripe secret key for payment processing
   - Value: Your Stripe secret key (starts with `sk_test_` or `sk_live_`)
   - Note: Can be set to "placeholder-stripe-key" for development

## How to Create Missing Secrets

### 1. AWS Credentials
- Go to AWS IAM Console
- Create a new user with programmatic access
- Attach policies: CloudFormation, S3, Lambda, API Gateway, IAM (limited)
- Save the Access Key ID and Secret Access Key

### 2. SAM Deployment Bucket
```bash
aws s3 mb s3://lplivings-sam-deployment-bucket-YOUR-ACCOUNT-ID
```

### 3. Google Service Account
- Go to Google Cloud Console
- Create a new project or use existing
- Enable Google Sheets API and Google OAuth2 API
- Create a Service Account
- Download the JSON key file
- Share your Google Sheet with the service account email

### 4. Google OAuth Client
- Go to Google Cloud Console → APIs & Services → Credentials
- Create OAuth 2.0 Client ID
- Add your domains to authorized origins

## Verification

After setting up all secrets, trigger a deployment by pushing to the `dev` branch:

```bash
git push origin dev
```

Check the GitHub Actions tab to see if the deployment succeeds.

## Troubleshooting

### Common Issues:
1. **Invalid parameter format**: Check JSON formatting in GOOGLE_CREDENTIALS
2. **S3 bucket not found**: Create the SAM deployment bucket
3. **Access denied**: Verify AWS credentials have correct permissions
4. **Google API errors**: Ensure APIs are enabled and service account has access

### Debug Commands:
```bash
# Check if secrets are accessible in workflow
echo "Secrets configured: ${{ secrets.AWS_ACCESS_KEY_ID != '' }}"

# Validate SAM template locally
sam validate --template template.yaml

# Test deployment locally (after setting up AWS credentials)
sam build && sam deploy --guided
```