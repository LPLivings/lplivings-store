# CI/CD Setup Guide

This guide explains how to set up Continuous Integration and Continuous Deployment for the LPLivings Store application using GitHub Actions.

## Overview

The CI/CD pipeline consists of:
- **Development Environment**: Auto-deploys on pushes to `dev` branch
- **Production Environment**: Deploys on pushes to `main` branch or manual triggers
- **Promotion Workflow**: Promotes code from `dev` to `prod` with testing

## Workflows

### 1. Development Deployment (`deploy-dev.yml`)
- **Trigger**: Push to `dev` branch
- **Environment**: development
- **Process**:
  1. Deploy backend using SAM
  2. Build and deploy frontend to S3
  3. Output deployment URLs

### 2. Production Deployment (`deploy-prod.yml`)
- **Trigger**: Push to `main` branch or manual dispatch
- **Environment**: production
- **Process**:
  1. Confirmation step for manual deployments
  2. Deploy backend using SAM
  3. Build and deploy frontend to S3
  4. Notify deployment status

### 3. Promotion Workflow (`promote-to-prod.yml`)
- **Trigger**: Manual dispatch only
- **Process**:
  1. Validate promotion confirmation
  2. Run tests on source branch
  3. Merge source branch to main
  4. Create release tag
  5. Trigger production deployment

## GitHub Secrets Setup

### Development Environment Secrets
```
AWS_ACCESS_KEY_ID              # AWS access key for dev
AWS_SECRET_ACCESS_KEY          # AWS secret key for dev
SAM_DEPLOYMENT_BUCKET          # S3 bucket for SAM deployments
GOOGLE_CLIENT_ID               # Google OAuth client ID for dev
GOOGLE_SHEETS_ID               # Google Sheets ID for dev
GOOGLE_CREDENTIALS             # Google service account JSON for dev
```

### Production Environment Secrets
```
AWS_ACCESS_KEY_ID_PROD         # AWS access key for prod
AWS_SECRET_ACCESS_KEY_PROD     # AWS secret key for prod
SAM_DEPLOYMENT_BUCKET_PROD     # S3 bucket for SAM deployments (prod)
GOOGLE_CLIENT_ID_PROD          # Google OAuth client ID for prod
GOOGLE_SHEETS_ID_PROD          # Google Sheets ID for prod
GOOGLE_CREDENTIALS_PROD        # Google service account JSON for prod
FRONTEND_BUCKET_PROD           # S3 bucket name for frontend (prod)
```

## Setup Instructions

### 1. Create GitHub Repository
1. Push your code to a GitHub repository
2. Create `dev` and `main` branches

### 2. Configure GitHub Secrets
1. Go to your repository → Settings → Secrets and variables → Actions
2. Add all the secrets listed above with your actual values

### 3. Set up Environments
1. Go to Settings → Environments
2. Create `development` environment
3. Create `production` environment
4. Configure protection rules for production (optional)

### 4. AWS Permissions
Ensure your AWS IAM user has permissions for:
- CloudFormation (full access)
- Lambda (full access)
- API Gateway (full access)
- S3 (full access)
- IAM (sufficient permissions for creating roles)

### 5. Google Cloud Setup
For each environment (dev/prod):
1. Create separate Google Cloud projects or use separate service accounts
2. Enable Google Sheets API
3. Create OAuth 2.0 credentials
4. Create service account and download JSON key
5. Share Google Sheets with service account email

## Usage

### Deploying to Development
```bash
git checkout dev
git add .
git commit -m "Your changes"
git push origin dev
```
This automatically triggers the dev deployment.

### Promoting to Production
1. Go to GitHub Actions tab
2. Select "Promote Dev to Production" workflow
3. Click "Run workflow"
4. Enter "PROMOTE" to confirm
5. Specify source branch (usually "dev")

### Manual Production Deployment
1. Go to GitHub Actions tab
2. Select "Deploy to Production" workflow
3. Click "Run workflow"
4. Enter "DEPLOY" to confirm

## Environment Variables

### Backend
The SAM template uses these parameters:
- `Environment`: dev or prod
- `GoogleClientId`: OAuth client ID
- `GoogleSheetsId`: Spreadsheet ID
- `GoogleCredentials`: Service account JSON

### Frontend
React app uses these environment variables:
- `REACT_APP_API_URL`: Backend API endpoint
- `REACT_APP_GOOGLE_CLIENT_ID`: OAuth client ID
- `REACT_APP_ENVIRONMENT`: Environment name

## Monitoring

### CloudWatch Logs
- Lambda function logs: `/aws/lambda/function-name`
- API Gateway logs: Enable in API Gateway settings

### GitHub Actions
- View workflow runs in the Actions tab
- Check logs for deployment details
- Monitor deployment status and errors

## Troubleshooting

### Common Issues

1. **AWS Permissions**: Ensure IAM user has sufficient permissions
2. **S3 Bucket Names**: Must be globally unique
3. **Google Credentials**: Ensure JSON is properly formatted and escaped
4. **Environment Secrets**: Verify all required secrets are set

### Rollback
To rollback a production deployment:
1. Identify the previous working commit
2. Run manual production deployment from that commit
3. Or revert the commit and push to main

## Security Best Practices

1. **Separate AWS Accounts**: Use different AWS accounts for dev/prod
2. **Least Privilege**: Grant minimal required permissions
3. **Secret Rotation**: Regularly rotate AWS keys and credentials
4. **Environment Protection**: Set up branch protection rules
5. **Review Process**: Require PR reviews for main branch

## Next Steps

1. Set up monitoring and alerting
2. Add integration tests to the promotion workflow
3. Implement blue-green deployment for zero downtime
4. Add database migration scripts if needed
5. Set up custom domains and SSL certificates