# Domain Setup Guide for LPLivings Store

This guide walks you through setting up custom domains for your LPLivings Store application.

## 📋 Domain Structure

### Development Environment
- **Frontend**: `lplivings-dev.selfcaretech.com`
- **Backend API**: `api-dev.selfcaretech.com`

### Production Environment  
- **Frontend**: `lplivings.selfcaretech.com`
- **Backend API**: `api.selfcaretech.com`

## 🏗️ Infrastructure Overview

### Fixed Resources Created
✅ **S3 Buckets** (already created):
- `lplivings-dev-frontend` - Development frontend
- `lplivings-prod-frontend` - Production frontend

### Required Infrastructure
🔧 **Still needed**:
- SSL Certificates (ACM)
- CloudFront Distributions
- API Gateway Custom Domains
- DNS Records

## 📝 Setup Steps

### Step 1: Request SSL Certificates

You need SSL certificates in **us-east-1** region for CloudFront.

```bash
# Request certificate for development
aws acm request-certificate \
    --domain-name lplivings-dev.selfcaretech.com \
    --subject-alternative-names api-dev.selfcaretech.com \
    --validation-method DNS \
    --region us-east-1

# Request certificate for production  
aws acm request-certificate \
    --domain-name lplivings.selfcaretech.com \
    --subject-alternative-names api.selfcaretech.com \
    --validation-method DNS \
    --region us-east-1
```

**Important**: Note the Certificate ARNs returned - you'll need them later.

### Step 2: Validate Certificates

1. Go to AWS Certificate Manager console
2. For each certificate, add the DNS validation records to your domain provider
3. Wait for validation to complete (can take up to 30 minutes)

### Step 3: Deploy CloudFront for Development

```bash
# Deploy CloudFront distribution for dev
aws cloudformation deploy \
    --template-file infrastructure/cloudfront-template.yaml \
    --stack-name lplivings-dev-cloudfront \
    --parameter-overrides \
        Environment=dev \
        DomainName=lplivings-dev.selfcaretech.com \
        CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
        S3BucketName=lplivings-dev-frontend \
    --region us-east-1
```

### Step 4: Deploy CloudFront for Production

```bash
# Deploy CloudFront distribution for prod
aws cloudformation deploy \
    --template-file infrastructure/cloudfront-template.yaml \
    --stack-name lplivings-prod-cloudfront \
    --parameter-overrides \
        Environment=prod \
        DomainName=lplivings.selfcaretech.com \
        CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
        S3BucketName=lplivings-prod-frontend \
    --region us-east-1
```

### Step 5: Get API Gateway IDs

Find your API Gateway REST API IDs:

```bash
# List API Gateways to find the IDs
aws apigateway get-rest-apis --query 'items[?name==`lplivings-ecommerce-dev`].id' --output text
aws apigateway get-rest-apis --query 'items[?name==`lplivings-ecommerce-prod`].id' --output text
```

### Step 6: Deploy API Gateway Custom Domains

```bash
# Deploy API custom domain for dev
aws cloudformation deploy \
    --template-file infrastructure/api-gateway-domain-template.yaml \
    --stack-name lplivings-dev-api-domain \
    --parameter-overrides \
        Environment=dev \
        ApiDomainName=api-dev.selfcaretech.com \
        CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
        ApiGatewayId=YOUR_DEV_API_ID \
        ApiGatewayStageName=dev \
    --region us-east-1

# Deploy API custom domain for prod  
aws cloudformation deploy \
    --template-file infrastructure/api-gateway-domain-template.yaml \
    --stack-name lplivings-prod-api-domain \
    --parameter-overrides \
        Environment=prod \
        ApiDomainName=api.selfcaretech.com \
        CertificateArn=arn:aws:acm:us-east-1:ACCOUNT:certificate/CERT-ID \
        ApiGatewayId=YOUR_PROD_API_ID \
        ApiGatewayStageName=prod \
    --region us-east-1
```

### Step 7: Get CloudFront Distribution Domain Names

```bash
# Get CloudFront domain names for DNS setup
aws cloudformation describe-stacks \
    --stack-name lplivings-dev-cloudfront \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text

aws cloudformation describe-stacks \
    --stack-name lplivings-prod-cloudfront \
    --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDomainName`].OutputValue' \
    --output text

# Get API Gateway CloudFront domain names
aws cloudformation describe-stacks \
    --stack-name lplivings-dev-api-domain \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayDistributionDomainName`].OutputValue' \
    --output text

aws cloudformation describe-stacks \
    --stack-name lplivings-prod-api-domain \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayDistributionDomainName`].OutputValue' \
    --output text
```

### Step 8: Configure DNS Records

Add these CNAME records to your DNS provider (e.g., Cloudflare, Route53):

#### Development Environment
```
lplivings-dev.selfcaretech.com CNAME d1234567890abc.cloudfront.net
api-dev.selfcaretech.com      CNAME d0987654321def.cloudfront.net
```

#### Production Environment  
```
lplivings.selfcaretech.com    CNAME d1111111111111.cloudfront.net
api.selfcaretech.com          CNAME d2222222222222.cloudfront.net
```

**Note**: Replace the CloudFront domain names with the actual ones from Step 7.

## 🔧 Current Status

### Fixed S3 Buckets
✅ **lplivings-dev-frontend**
- URL: http://lplivings-dev-frontend.s3-website-us-east-1.amazonaws.com
- Status: Ready for use

✅ **lplivings-prod-frontend**  
- URL: http://lplivings-prod-frontend.s3-website-us-east-1.amazonaws.com
- Status: Ready for use

### API Endpoints
✅ **Development API**
- URL: https://5pyjyltkoa.execute-api.us-east-1.amazonaws.com/dev
- Status: Active

🔧 **Production API**
- Status: Will be created when deploying to prod

## 🚀 Deployment Process

### Development
```bash
# Deploy current frontend to fixed dev bucket
cd frontend
aws s3 sync build/ s3://lplivings-dev-frontend --delete
```

### Production
```bash
# Will be automated via CI/CD when deploying to main branch
git push origin main
```

## 📊 Monitoring

### CloudFront Metrics
- Monitor via AWS CloudWatch
- Check cache hit ratios
- Monitor origin response times

### API Gateway Metrics
- Request count and latency
- Error rates (4xx, 5xx)
- Cache utilization

## 🔍 Troubleshooting

### Common Issues

1. **Certificate Validation Stuck**
   - Verify DNS records are correct
   - Check with your DNS provider
   - Can take up to 30 minutes

2. **CloudFront Not Working**
   - Check origin access identity
   - Verify S3 bucket policy
   - Check custom error pages

3. **API Domain Issues**
   - Verify API Gateway stage exists
   - Check base path mapping
   - Ensure certificate is in us-east-1

### Useful Commands

```bash
# Check certificate status
aws acm list-certificates --region us-east-1

# Check CloudFront distribution status  
aws cloudfront list-distributions

# Check API Gateway custom domains
aws apigateway get-domain-names

# Test DNS resolution
nslookup lplivings-dev.selfcaretech.com
nslookup api-dev.selfcaretech.com
```

## 💡 Next Steps

1. **Request SSL certificates** for your domains
2. **Deploy CloudFront distributions** using the templates
3. **Configure DNS records** with your domain provider
4. **Test the custom domains** work correctly
5. **Update frontend environment variables** to use custom API domains

Once complete, you'll have:
- **Dev**: https://lplivings-dev.selfcaretech.com
- **Prod**: https://lplivings.selfcaretech.com
- **Dev API**: https://api-dev.selfcaretech.com  
- **Prod API**: https://api.selfcaretech.com