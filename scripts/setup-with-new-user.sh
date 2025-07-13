#!/bin/bash

# AWS Setup with New User Credentials
# Run this after creating the new AWS user

set -e

echo "🚀 Setting up AWS resources with new user credentials..."

# Prompt for new credentials
echo "Enter your new AWS user credentials:"
read -p "AWS_ACCESS_KEY_ID: " NEW_AWS_ACCESS_KEY_ID
read -s -p "AWS_SECRET_ACCESS_KEY: " NEW_AWS_SECRET_ACCESS_KEY
echo ""

# Export new credentials for this session
export AWS_ACCESS_KEY_ID="$NEW_AWS_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$NEW_AWS_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="us-east-1"

# Test credentials
echo "🔍 Testing new credentials..."
USER_INFO=$(aws sts get-caller-identity)
echo "✅ Credentials work! User: $(echo $USER_INFO | jq -r '.Arn')"

# Get account info
ACCOUNT_ID=$(echo $USER_INFO | jq -r '.Account')
REGION="us-east-1"

echo "📋 AWS Account: $ACCOUNT_ID"
echo "🌍 Region: $REGION"

# Create S3 bucket for SAM deployments
BUCKET_NAME="lplivings-sam-deployments-$(date +%s)"
echo "🪣 Creating S3 bucket: $BUCKET_NAME"

aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
echo "✅ Created S3 bucket: $BUCKET_NAME"

# Create S3 bucket for app images
IMAGE_BUCKET_NAME="lplivings-app-images-$(date +%s)"
echo "🖼️  Creating S3 bucket for images: $IMAGE_BUCKET_NAME"

aws s3 mb "s3://$IMAGE_BUCKET_NAME" --region "$REGION"

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

# Clean up
rm -f /tmp/image-bucket-policy.json

echo ""
echo "🎉 AWS setup complete!"
echo ""
echo "📋 GitHub Secrets Values:"
echo "   AWS_ACCESS_KEY_ID: $NEW_AWS_ACCESS_KEY_ID"
echo "   AWS_SECRET_ACCESS_KEY: $NEW_AWS_SECRET_ACCESS_KEY"
echo "   SAM_DEPLOYMENT_BUCKET: $BUCKET_NAME"
echo "   IMAGE_BUCKET: $IMAGE_BUCKET_NAME"
echo ""
echo "🔗 Set these at: https://github.com/LPLivings/lplivings-store/settings/secrets/actions"

# Optional: Set GitHub secrets automatically
read -p "Do you want to set GitHub secrets automatically? (y/n): " SET_SECRETS

if [[ $SET_SECRETS =~ ^[Yy]$ ]]; then
    if command -v gh &> /dev/null; then
        echo "🔐 Setting GitHub secrets..."
        
        REPO="LPLivings/lplivings-store"
        
        echo "$NEW_AWS_ACCESS_KEY_ID" | gh secret set "AWS_ACCESS_KEY_ID" --repo "$REPO"
        echo "$NEW_AWS_SECRET_ACCESS_KEY" | gh secret set "AWS_SECRET_ACCESS_KEY" --repo "$REPO"
        echo "$BUCKET_NAME" | gh secret set "SAM_DEPLOYMENT_BUCKET" --repo "$REPO"
        echo "$IMAGE_BUCKET_NAME" | gh secret set "IMAGE_BUCKET" --repo "$REPO"
        echo "798957662471-iqq2rj6p37im7ea4ct14afa7841p6ln3.apps.googleusercontent.com" | gh secret set "GOOGLE_CLIENT_ID" --repo "$REPO"
        echo "1D5FOZAhUh7WX99O7uMW9L3Dsx_M9KPlOC9gMeNIS5iI" | gh secret set "GOOGLE_SHEETS_ID" --repo "$REPO"
        
        echo "✅ GitHub secrets set automatically!"
        echo "🚨 Still need to set GOOGLE_CREDENTIALS manually"
    else
        echo "Install GitHub CLI first: brew install gh"
    fi
fi