# SelfCareTech.com Domain Mapping for LPLivings Store

Since you own `selfcaretech.com`, here's the complete step-by-step guide to map your custom endpoints.

## 🎯 Target Endpoints

### Development
- **Frontend**: `lplivings-dev.selfcaretech.com`
- **API**: `api-dev.selfcaretech.com`

### Production  
- **Frontend**: `lplivings.selfcaretech.com`
- **API**: `api.selfcaretech.com`

## 📋 Step-by-Step Setup

### Step 1: Request SSL Certificates in AWS

First, we need SSL certificates for your domains. **Important**: Certificates for CloudFront must be in `us-east-1` region.

```bash
# Set your AWS credentials
export AWS_ACCESS_KEY_ID="AKIAQ3EGVTDIVPPZKHDQ"
export AWS_SECRET_ACCESS_KEY="4TzN0MnO+p69Qa6LXXC8eiZfo1yYuGuD64NqNvww"
export AWS_DEFAULT_REGION="us-east-1"

# Request certificate for development environment
aws acm request-certificate \
    --domain-name lplivings-dev.selfcaretech.com \
    --subject-alternative-names api-dev.selfcaretech.com \
    --validation-method DNS \
    --region us-east-1

# Request certificate for production environment  
aws acm request-certificate \
    --domain-name lplivings.selfcaretech.com \
    --subject-alternative-names api.selfcaretech.com \
    --validation-method DNS \
    --region us-east-1
```

**Important**: Save the Certificate ARNs that are returned - you'll need them later!

### Step 2: Get DNS Validation Records

After requesting certificates, get the validation records:

```bash
# List certificates to get ARNs and validation records
aws acm list-certificates --region us-east-1

# Get detailed validation info for each certificate
aws acm describe-certificate --certificate-arn "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/CERT_ID" --region us-east-1
```

### Step 3: Add DNS Validation Records

You'll get DNS validation records like this for each domain:

```
Name: _abcd1234567890abcdef1234567890ab.lplivings-dev.selfcaretech.com
Type: CNAME
Value: _xyz9876543210xyz9876543210xyz987.example.acm-validations.aws.
```

**Add these CNAME records to your DNS provider** (wherever you manage selfcaretech.com DNS):

#### If using Cloudflare:
1. Go to Cloudflare dashboard → DNS
2. Add CNAME records for each validation record
3. Set Proxy Status to "DNS Only" (gray cloud)

#### If using AWS Route53:
```bash
# Example - replace with your actual values
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
    "Changes": [{
        "Action": "CREATE",
        "ResourceRecordSet": {
            "Name": "_abcd1234567890abcdef1234567890ab.lplivings-dev.selfcaretech.com",
            "Type": "CNAME", 
            "TTL": 300,
            "ResourceRecords": [{"Value": "_xyz9876543210xyz9876543210xyz987.example.acm-validations.aws."}]
        }
    }]
}'
```

### Step 4: Wait for Certificate Validation

```bash
# Check certificate status (repeat until ISSUED)
aws acm describe-certificate --certificate-arn "arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/CERT_ID" --region us-east-1 --query 'Certificate.Status'
```

This can take 5-30 minutes. Status should change from `PENDING_VALIDATION` to `ISSUED`.

### Step 5: Get Your API Gateway IDs

```bash
# Find your existing API Gateway IDs
aws apigateway get-rest-apis --query 'items[?contains(name, `lplivings-ecommerce`)][name,id]' --output table
```

You should see something like:
```
lplivings-ecommerce-dev    abc123def456
lplivings-ecommerce-prod   ghi789jkl012  (when you deploy prod)
```

### Step 6: Deploy CloudFront for Development

Replace `YOUR_DEV_CERT_ARN` with the actual certificate ARN from Step 1:

```bash
cd infrastructure

aws cloudformation deploy \
    --template-file cloudfront-template.yaml \
    --stack-name lplivings-dev-cloudfront \
    --parameter-overrides \
        Environment=dev \
        DomainName=lplivings-dev.selfcaretech.com \
        CertificateArn=arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_DEV_CERT_ID \
        S3BucketName=lplivings-dev-frontend \
    --region us-east-1 \
    --capabilities CAPABILITY_IAM
```

### Step 7: Deploy API Gateway Custom Domain for Development

Replace `YOUR_DEV_API_ID` with the API ID from Step 5:

```bash
aws cloudformation deploy \
    --template-file api-gateway-domain-template.yaml \
    --stack-name lplivings-dev-api-domain \
    --parameter-overrides \
        Environment=dev \
        ApiDomainName=api-dev.selfcaretech.com \
        CertificateArn=arn:aws:acm:us-east-1:YOUR_ACCOUNT:certificate/YOUR_DEV_CERT_ID \
        ApiGatewayId=YOUR_DEV_API_ID \
        ApiGatewayStageName=dev \
    --region us-east-1 \
    --capabilities CAPABILITY_IAM
```

### Step 8: Get CloudFront Domain Names for DNS

```bash
# Get the CloudFront domain name for frontend
aws cloudformation describe-stacks \
    --stack-name lplivings-dev-cloudfront \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text

# Get the CloudFront domain name for API  
aws cloudformation describe-stacks \
    --stack-name lplivings-dev-api-domain \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayDistributionDomainName`].OutputValue' \
    --output text
```

### Step 9: Add CNAME Records for Your Custom Domains

Add these CNAME records to your DNS provider:

```
# Development Environment
lplivings-dev.selfcaretech.com   CNAME   d1234567890abc.cloudfront.net
api-dev.selfcaretech.com         CNAME   d0987654321def.cloudfront.net
```

**Replace the CloudFront domain names with the actual ones from Step 8.**

#### If using Cloudflare:
1. Go to Cloudflare dashboard → DNS  
2. Add CNAME record: `lplivings-dev` → `d1234567890abc.cloudfront.net`
3. Add CNAME record: `api-dev` → `d0987654321def.cloudfront.net`
4. Set Proxy Status to "DNS Only" (gray cloud) for both

#### If using Route53:
```bash
# Replace YOUR_ZONE_ID and actual CloudFront domains
aws route53 change-resource-record-sets --hosted-zone-id YOUR_ZONE_ID --change-batch '{
    "Changes": [
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "lplivings-dev.selfcaretech.com",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{"Value": "d1234567890abc.cloudfront.net"}]
            }
        },
        {
            "Action": "CREATE", 
            "ResourceRecordSet": {
                "Name": "api-dev.selfcaretech.com",
                "Type": "CNAME",
                "TTL": 300,
                "ResourceRecords": [{"Value": "d0987654321def.cloudfront.net"}]
            }
        }
    ]
}'
```

### Step 10: Test Your Development Environment

Wait 5-10 minutes for DNS propagation, then test:

```bash
# Test DNS resolution
nslookup lplivings-dev.selfcaretech.com
nslookup api-dev.selfcaretech.com

# Test HTTPS endpoints
curl -I https://lplivings-dev.selfcaretech.com
curl -I https://api-dev.selfcaretech.com
```

### Step 11: Update Frontend to Use Custom API Domain

Update your frontend environment variables:

```bash
# Update the dev environment file
echo "REACT_APP_API_URL=https://api-dev.selfcaretech.com" > frontend/.env.dev
echo "REACT_APP_GOOGLE_CLIENT_ID=798957662471-iqq2rj6p37im7ea4ct14afa7841p6ln3.apps.googleusercontent.com" >> frontend/.env.dev
echo "REACT_APP_ENVIRONMENT=dev" >> frontend/.env.dev

# Rebuild and deploy
cd frontend
npm run build
aws s3 sync build/ s3://lplivings-dev-frontend --delete
```

### Step 12: Set Up Production (When Ready)

Repeat Steps 6-11 for production using:
- `lplivings.selfcaretech.com` 
- `api.selfcaretech.com`
- Production certificate ARN
- Production API Gateway ID
- `lplivings-prod-frontend` bucket

## 🔧 Current Status After Setup

### Development Environment ✅
- **Frontend**: https://lplivings-dev.selfcaretech.com
- **API**: https://api-dev.selfcaretech.com  
- **Fallback**: http://lplivings-dev-frontend.s3-website-us-east-1.amazonaws.com

### Production Environment (After Setup)
- **Frontend**: https://lplivings.selfcaretech.com
- **API**: https://api.selfcaretech.com
- **Fallback**: http://lplivings-prod-frontend.s3-website-us-east-1.amazonaws.com

## 🚀 Quick Start Commands

Here's the complete command sequence (replace the ARNs and IDs with your actual values):

```bash
# 1. Request certificates
aws acm request-certificate --domain-name lplivings-dev.selfcaretech.com --subject-alternative-names api-dev.selfcaretech.com --validation-method DNS --region us-east-1

# 2. Add DNS validation records to your domain provider

# 3. Deploy CloudFront (after certificate is ISSUED)
aws cloudformation deploy --template-file infrastructure/cloudfront-template.yaml --stack-name lplivings-dev-cloudfront --parameter-overrides Environment=dev DomainName=lplivings-dev.selfcaretech.com CertificateArn=YOUR_CERT_ARN S3BucketName=lplivings-dev-frontend --region us-east-1 --capabilities CAPABILITY_IAM

# 4. Deploy API domain (replace YOUR_API_ID)
aws cloudformation deploy --template-file infrastructure/api-gateway-domain-template.yaml --stack-name lplivings-dev-api-domain --parameter-overrides Environment=dev ApiDomainName=api-dev.selfcaretech.com CertificateArn=YOUR_CERT_ARN ApiGatewayId=YOUR_API_ID ApiGatewayStageName=dev --region us-east-1 --capabilities CAPABILITY_IAM

# 5. Get CloudFront domains and add CNAME records to your DNS
# 6. Test the endpoints
# 7. Update frontend to use custom API domain
```

## 📞 Support

If you run into issues:

1. **Certificate validation stuck**: Check DNS records are correct
2. **CloudFront not working**: Check origin access identity and S3 bucket policy  
3. **API domain issues**: Verify API Gateway stage exists and base path mapping
4. **DNS not resolving**: Wait up to 48 hours for full propagation

**Your custom domains will be live once you complete these steps!** 🚀