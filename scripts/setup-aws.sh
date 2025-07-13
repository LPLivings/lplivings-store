#!/bin/bash

# AWS Setup Automation Script
# This script creates the necessary AWS resources for the e-commerce app

set -e

echo "🚀 Setting up AWS resources for lplivings-store..."

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

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-east-1")

echo "📋 AWS Account: $ACCOUNT_ID"
echo "🌍 Region: $REGION"

# Create IAM user for GitHub Actions
USER_NAME="lplivings-github-actions"
echo "👤 Creating IAM user: $USER_NAME"

if aws iam get-user --user-name $USER_NAME &> /dev/null; then
    echo "ℹ️  User $USER_NAME already exists"
else
    aws iam create-user --user-name $USER_NAME
    echo "✅ Created user: $USER_NAME"
fi

# Create and attach policy
POLICY_NAME="LPLivingsDeploymentPolicy"
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

echo "📋 Creating IAM policy: $POLICY_NAME"

# Create policy document
cat > /tmp/deployment-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:*",
                "apigateway:*",
                "iam:GetRole",
                "iam:CreateRole",
                "iam:DeleteRole",
                "iam:PutRolePolicy",
                "iam:AttachRolePolicy",
                "iam:DetachRolePolicy",
                "iam:DeleteRolePolicy",
                "iam:PassRole",
                "cloudformation:*",
                "s3:*",
                "logs:*",
                "events:*"
            ],
            "Resource": "*"
        }
    ]
}
EOF

if aws iam get-policy --policy-arn $POLICY_ARN &> /dev/null; then
    echo "ℹ️  Policy $POLICY_NAME already exists"
else
    aws iam create-policy \
        --policy-name $POLICY_NAME \
        --policy-document file:///tmp/deployment-policy.json
    echo "✅ Created policy: $POLICY_NAME"
fi

# Attach policy to user
echo "🔗 Attaching policy to user..."
aws iam attach-user-policy \
    --user-name $USER_NAME \
    --policy-arn $POLICY_ARN
echo "✅ Policy attached"

# Create access key
echo "🔑 Creating access key..."
if aws iam list-access-keys --user-name $USER_NAME --query 'AccessKeyMetadata[0].AccessKeyId' --output text | grep -q "AKIA"; then
    echo "ℹ️  Access key already exists for user $USER_NAME"
    echo "⚠️  You may need to create a new one or use existing credentials"
    AWS_ACCESS_KEY_ID=$(aws iam list-access-keys --user-name $USER_NAME --query 'AccessKeyMetadata[0].AccessKeyId' --output text)
    echo "📋 Existing Access Key ID: $AWS_ACCESS_KEY_ID"
else
    KEY_OUTPUT=$(aws iam create-access-key --user-name $USER_NAME)
    AWS_ACCESS_KEY_ID=$(echo $KEY_OUTPUT | jq -r '.AccessKey.AccessKeyId')
    AWS_SECRET_ACCESS_KEY=$(echo $KEY_OUTPUT | jq -r '.AccessKey.SecretAccessKey')
    
    echo "✅ Access key created"
    echo "📋 Access Key ID: $AWS_ACCESS_KEY_ID"
    echo "🔐 Secret Access Key: $AWS_SECRET_ACCESS_KEY"
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
rm -f /tmp/deployment-policy.json /tmp/image-bucket-policy.json

echo ""
echo "🎉 AWS setup complete!"
echo ""
echo "📋 Add these secrets to GitHub:"
echo "   AWS_ACCESS_KEY_ID: $AWS_ACCESS_KEY_ID"
if [ ! -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "   AWS_SECRET_ACCESS_KEY: $AWS_SECRET_ACCESS_KEY"
fi
echo "   SAM_DEPLOYMENT_BUCKET: $BUCKET_NAME"
echo "   IMAGE_BUCKET: $IMAGE_BUCKET_NAME"
echo ""
echo "🔗 GitHub Secrets URL: https://github.com/LPLivings/lplivings-store/settings/secrets/actions"