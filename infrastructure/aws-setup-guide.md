# AWS Setup Guide

## 3.1 Install AWS CLI (if not already installed)

### For macOS:
```bash
brew install awscli
```

### For Windows:
Download from: https://aws.amazon.com/cli/

### For Linux:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

## 3.2 Create IAM User for Deployment

1. **Go to AWS Console**: https://console.aws.amazon.com
2. **Search for "IAM"** in the search bar and click it
3. **Click "Users"** in the left sidebar
4. **Click "Create user"**
5. **User name**: `ecommerce-deployer`
6. **Check**: "Provide user access to the AWS Management Console" (optional)
7. **Click "Next"**

### Attach Policies:
Click "Attach policies directly" and search for these policies (check the box for each):
- `AWSCloudFormationFullAccess`
- `IAMFullAccess` 
- `AmazonS3FullAccess`
- `AWSLambda_FullAccess`
- `AmazonAPIGatewayAdministrator`
- `AmplifyFullAccess`

8. **Click "Next"** → **"Create user"**

## 3.3 Create Access Keys

1. **Click on your new user** (`ecommerce-deployer`)
2. **Go to "Security credentials" tab**
3. **Scroll down to "Access keys"**
4. **Click "Create access key"**
5. **Select "Command Line Interface (CLI)"**
6. **Check** the confirmation box
7. **Click "Next"** → **"Create access key"**
8. **⚠️ IMPORTANT**: Copy both the Access Key ID and Secret Access Key (you can't see the secret again!)

## 3.4 Configure AWS CLI

Run this command and enter your credentials:
```bash
aws configure
```

Enter:
- **AWS Access Key ID**: (from step 3.3)
- **AWS Secret Access Key**: (from step 3.3)  
- **Default region name**: `us-east-1`
- **Default output format**: `json`

## 3.5 Create S3 Bucket for Deployments

```bash
aws s3 mb s3://ecommerce-sam-deploy-$(date +%s) --region us-east-1
```

**Note the bucket name** - you'll need it later!

## 3.6 Install SAM CLI

### For macOS:
```bash
brew install aws-sam-cli
```

### For Windows:
Download from: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html

### For Linux:
```bash
wget https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip
unzip aws-sam-cli-linux-x86_64.zip -d sam-installation
sudo ./sam-installation/install
```

## Verify Setup

Test everything works:
```bash
aws sts get-caller-identity
sam --version
```

You should see your AWS account info and SAM version.