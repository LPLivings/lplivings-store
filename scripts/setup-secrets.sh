#!/bin/bash

# AWS Secrets Manager Setup Script
# Run this script to create all required secrets for the application

set -e

REGION="us-east-1"
ENVIRONMENT="prod"

echo "🔐 Setting up AWS Secrets Manager for LPLivings Store"
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo ""

# Function to create or update secret
create_or_update_secret() {
    local secret_name=$1
    local secret_value=$2
    local description=$3
    
    echo "Creating secret: $secret_name"
    
    # Try to create the secret
    aws secretsmanager create-secret \
        --name "$secret_name" \
        --description "$description" \
        --secret-string "$secret_value" \
        --region "$REGION" 2>/dev/null || \
    
    # If it exists, update it
    aws secretsmanager update-secret \
        --secret-id "$secret_name" \
        --secret-string "$secret_value" \
        --region "$REGION"
    
    echo "✅ Secret $secret_name created/updated"
}

# Create secrets (you'll need to replace these values with your actual secrets)
echo "📝 Please provide your secrets:"
echo ""

read -p "Enter your Stripe Secret Key (sk_live_...): " STRIPE_SECRET_KEY
read -p "Enter your Stripe Publishable Key (pk_live_...): " STRIPE_PUBLISHABLE_KEY
read -p "Enter your Google Client ID: " GOOGLE_CLIENT_ID
read -p "Enter your Google Sheets ID: " GOOGLE_SHEETS_ID
read -p "Enter your Admin Emails (comma-separated): " ADMIN_EMAILS

echo ""
echo "Enter your Google Service Account Credentials JSON (paste the entire JSON, then press Enter and Ctrl+D):"
GOOGLE_CREDENTIALS=$(cat)

echo ""
echo "🚀 Creating secrets in AWS Secrets Manager..."
echo ""

# Create all secrets
create_or_update_secret \
    "lplivings-store/$ENVIRONMENT/stripe-secret-key" \
    "$STRIPE_SECRET_KEY" \
    "Stripe secret key for payment processing"

create_or_update_secret \
    "lplivings-store/$ENVIRONMENT/stripe-publishable-key" \
    "$STRIPE_PUBLISHABLE_KEY" \
    "Stripe publishable key for frontend"

create_or_update_secret \
    "lplivings-store/$ENVIRONMENT/google-client-id" \
    "$GOOGLE_CLIENT_ID" \
    "Google OAuth client ID"

create_or_update_secret \
    "lplivings-store/$ENVIRONMENT/google-sheets-id" \
    "$GOOGLE_SHEETS_ID" \
    "Google Sheets ID for data storage"

create_or_update_secret \
    "lplivings-store/$ENVIRONMENT/google-credentials" \
    "$GOOGLE_CREDENTIALS" \
    "Google service account credentials JSON"

create_or_update_secret \
    "lplivings-store/$ENVIRONMENT/admin-emails" \
    "$ADMIN_EMAILS" \
    "Admin emails for elevated permissions"

echo ""
echo "🎉 All secrets created successfully!"
echo ""
echo "Secret names created:"
echo "- lplivings-store/$ENVIRONMENT/stripe-secret-key"
echo "- lplivings-store/$ENVIRONMENT/stripe-publishable-key"
echo "- lplivings-store/$ENVIRONMENT/google-client-id"
echo "- lplivings-store/$ENVIRONMENT/google-sheets-id"
echo "- lplivings-store/$ENVIRONMENT/google-credentials"
echo "- lplivings-store/$ENVIRONMENT/admin-emails"
echo ""
echo "✅ Ready to update your application to use these secrets!"