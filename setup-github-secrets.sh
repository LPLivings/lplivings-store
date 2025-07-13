#!/bin/bash

# GitHub Secrets Setup Script
# This script helps you set up the required GitHub secrets for deployment

set -e

echo "🔧 GitHub Secrets Setup for LPLivings Store"
echo "=============================================="
echo ""

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed."
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Check if logged in to GitHub
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI."
    echo "Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"
echo ""

# Get repository info
REPO=$(gh repo view --json owner,name -q '.owner.login + "/" + .name')
echo "📁 Repository: $REPO"
echo ""

echo "🔑 Setting up GitHub Secrets..."
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local description=$2
    local example=$3
    local required=$4
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Setting up: $secret_name"
    echo "Description: $description"
    if [[ -n "$example" ]]; then
        echo "Example: $example"
    fi
    echo ""
    
    if [[ "$required" == "true" ]]; then
        echo "⚠️  This secret is REQUIRED for deployment"
    else
        echo "ℹ️  This secret is optional"
    fi
    echo ""
    
    read -p "Do you want to set $secret_name now? (y/n): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [[ "$secret_name" == "GOOGLE_CREDENTIALS" ]]; then
            echo "For GOOGLE_CREDENTIALS, please provide the path to your JSON file:"
            read -p "Path to Google Service Account JSON file: " json_path
            if [[ -f "$json_path" ]]; then
                gh secret set $secret_name < "$json_path"
                echo "✅ $secret_name set from file: $json_path"
            else
                echo "❌ File not found: $json_path"
            fi
        else
            echo "Enter the value for $secret_name:"
            read -s secret_value
            echo "$secret_value" | gh secret set $secret_name
            echo "✅ $secret_name set successfully"
        fi
    else
        echo "⏭️  Skipping $secret_name"
    fi
    echo ""
}

# Set up each secret
set_secret "AWS_ACCESS_KEY_ID" \
    "AWS Access Key for deployment" \
    "AKIA..." \
    "true"

set_secret "AWS_SECRET_ACCESS_KEY" \
    "AWS Secret Access Key for deployment" \
    "ABC123..." \
    "true"

set_secret "SAM_DEPLOYMENT_BUCKET" \
    "S3 bucket for SAM deployment artifacts" \
    "lplivings-sam-deployment-bucket" \
    "true"

set_secret "GOOGLE_CLIENT_ID" \
    "Google OAuth Client ID" \
    "123456789-abc.apps.googleusercontent.com" \
    "true"

set_secret "GOOGLE_SHEETS_ID" \
    "Google Sheets ID for data storage" \
    "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" \
    "true"

set_secret "GOOGLE_CREDENTIALS" \
    "Google Service Account JSON credentials" \
    "" \
    "true"

set_secret "STRIPE_SECRET_KEY" \
    "Stripe secret key for payments" \
    "sk_test_..." \
    "false"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 GitHub Secrets setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Verify secrets at: https://github.com/$REPO/settings/secrets/actions"
echo "2. Push code to trigger deployment: git push origin dev"
echo "3. Monitor deployment: https://github.com/$REPO/actions"
echo ""
echo "📚 For detailed setup instructions, see: GITHUB-SECRETS-SETUP.md"
echo ""
echo "🚀 Happy deploying!"