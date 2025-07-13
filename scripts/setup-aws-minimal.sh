#!/bin/bash

# Minimal AWS Setup Script
# Uses existing credentials and creates only the required S3 buckets

set -e

echo "🚀 Setting up AWS resources for lplivings-store (minimal setup)..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if user is logged in
if ! aws sts get-caller-identity &> /dev/null; then
    echo "❌ AWS CLI not configured. Please run 'aws configure' first"
    exit 1
fi

# Get AWS account ID and current user
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")
CURRENT_USER=$(aws sts get-caller-identity --query Arn --output text)

echo "📋 AWS Account: $ACCOUNT_ID"
echo "🌍 Region: $REGION"
echo "👤 Current User: $CURRENT_USER"

# Get current access key
echo "🔑 Getting current access key..."
if [[ $CURRENT_USER == *"user/"* ]]; then
    USER_NAME=$(echo $CURRENT_USER | cut -d'/' -f2)
    ACCESS_KEYS=$(aws iam list-access-keys --user-name $USER_NAME --query 'AccessKeyMetadata[0].AccessKeyId' --output text 2>/dev/null || echo "")
    
    if [ ! -z "$ACCESS_KEYS" ] && [ "$ACCESS_KEYS" != "None" ]; then
        echo "📋 Current Access Key ID: $ACCESS_KEYS"
        AWS_ACCESS_KEY_ID=$ACCESS_KEYS
    else
        echo "⚠️  Could not retrieve access key ID automatically"
        echo "🔍 You can find it in AWS Console > IAM > Users > $USER_NAME > Security credentials"
    fi
else
    echo "⚠️  Using root credentials or role. Consider creating an IAM user for better security."
fi

# Create S3 bucket for SAM deployments
BUCKET_NAME="lplivings-sam-deployments-$(date +%s)"
echo "🪣 Creating S3 bucket: $BUCKET_NAME"

if aws s3 ls "s3://$BUCKET_NAME" &> /dev/null; then
    echo "ℹ️  Bucket already exists"
else
    if [ "$REGION" = "us-east-1" ]; then
        aws s3 mb "s3://$BUCKET_NAME"
    else
        aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
    fi
    echo "✅ Created S3 bucket: $BUCKET_NAME"
fi

# Create S3 bucket for app images
IMAGE_BUCKET_NAME="lplivings-app-images-$(date +%s)"
echo "🖼️  Creating S3 bucket for images: $IMAGE_BUCKET_NAME"

if aws s3 ls "s3://$IMAGE_BUCKET_NAME" &> /dev/null; then
    echo "ℹ️  Image bucket already exists"
else
    if [ "$REGION" = "us-east-1" ]; then
        aws s3 mb "s3://$IMAGE_BUCKET_NAME"
    else
        aws s3 mb "s3://$IMAGE_BUCKET_NAME" --region "$REGION"
    fi
    
    # Set public read policy for images
    cat > /tmp/image-bucket-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$IMAGE_BUCKET_NAME/*"
        }
    ]
}
EOF
    
    aws s3api put-bucket-policy \
        --bucket $IMAGE_BUCKET_NAME \
        --policy file:///tmp/image-bucket-policy.json
    
    echo "✅ Created S3 image bucket: $IMAGE_BUCKET_NAME"
fi

# Clean up temp files
rm -f /tmp/image-bucket-policy.json

echo ""
echo "🎉 AWS setup complete!"
echo ""
echo "📋 Use these values for GitHub secrets:"
if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "   AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
else
    echo "   AWS_ACCESS_KEY_ID: [Get from AWS Console > IAM > Users > Security credentials]"
fi
echo "   AWS_SECRET_ACCESS_KEY: [Your current secret key - check ~/.aws/credentials or AWS Console]"
echo "   SAM_DEPLOYMENT_BUCKET: $BUCKET_NAME"
echo "   IMAGE_BUCKET: $IMAGE_BUCKET_NAME"
echo ""
echo "🔍 To get your secret access key:"
echo "   - Check ~/.aws/credentials file"
echo "   - Or create new key in AWS Console > IAM > Users > [Your User] > Security credentials"
echo ""
echo "🔗 GitHub Secrets URL: https://github.com/LPLivings/lplivings-store/settings/secrets/actions"