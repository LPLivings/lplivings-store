#!/bin/bash

# GitHub Secrets Setup Script for CI/CD
# Sets up secrets for both development and production environments

set -e

echo "🔐 Setting up GitHub Secrets for LPLivings Store CI/CD..."

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it first:"
    echo "   macOS: brew install gh"
    echo "   Other: https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "🔑 Please authenticate with GitHub CLI:"
    gh auth login
fi

# Get repository information
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "your-username/your-repo")
echo "📋 Repository: $REPO"

# Function to set secret
set_secret() {
    local name=$1
    local value=$2
    local env=$3
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $name - no value provided"
        return
    fi
    
    echo "🔐 Setting secret: $name"
    if [ -n "$env" ]; then
        echo "$value" | gh secret set "$name" --repo "$REPO" --env "$env"
    else
        echo "$value" | gh secret set "$name" --repo "$REPO"
    fi
    echo "✅ Set $name"
}

echo ""
echo "🌍 Setting up DEVELOPMENT environment secrets..."

# Development secrets
read -p "AWS_ACCESS_KEY_ID (dev): " DEV_AWS_ACCESS_KEY_ID
read -s -p "AWS_SECRET_ACCESS_KEY (dev): " DEV_AWS_SECRET_ACCESS_KEY
echo ""
read -p "SAM_DEPLOYMENT_BUCKET (dev): " DEV_SAM_BUCKET

# Use existing values for development
DEV_GOOGLE_CLIENT_ID="798957662471-iqq2rj6p37im7ea4ct14afa7841p6ln3.apps.googleusercontent.com"
DEV_GOOGLE_SHEETS_ID="1D5FOZAhUh7WX99O7uMW9L3Dsx_M9KPlOC9gMeNIS5iI"
DEV_GOOGLE_CREDENTIALS='{"type":"service_account","project_id":"lp-livings"}'

echo ""
echo "🏭 Setting up PRODUCTION environment secrets..."

# Production secrets
read -p "AWS_ACCESS_KEY_ID (prod): " PROD_AWS_ACCESS_KEY_ID
read -s -p "AWS_SECRET_ACCESS_KEY (prod): " PROD_AWS_SECRET_ACCESS_KEY
echo ""
read -p "SAM_DEPLOYMENT_BUCKET (prod): " PROD_SAM_BUCKET
read -p "FRONTEND_BUCKET (prod): " PROD_FRONTEND_BUCKET

# Production Google settings (can be same as dev or different)
read -p "GOOGLE_CLIENT_ID (prod) [press Enter to use dev value]: " PROD_GOOGLE_CLIENT_ID
PROD_GOOGLE_CLIENT_ID=${PROD_GOOGLE_CLIENT_ID:-$DEV_GOOGLE_CLIENT_ID}

read -p "GOOGLE_SHEETS_ID (prod) [press Enter to use dev value]: " PROD_GOOGLE_SHEETS_ID
PROD_GOOGLE_SHEETS_ID=${PROD_GOOGLE_SHEETS_ID:-$DEV_GOOGLE_SHEETS_ID}

read -p "GOOGLE_CREDENTIALS (prod) [press Enter to use dev value]: " PROD_GOOGLE_CREDENTIALS
PROD_GOOGLE_CREDENTIALS=${PROD_GOOGLE_CREDENTIALS:-$DEV_GOOGLE_CREDENTIALS}

echo ""
echo "📤 Uploading secrets to GitHub..."

# Set development secrets
set_secret "AWS_ACCESS_KEY_ID" "$DEV_AWS_ACCESS_KEY_ID" "development"
set_secret "AWS_SECRET_ACCESS_KEY" "$DEV_AWS_SECRET_ACCESS_KEY" "development"
set_secret "SAM_DEPLOYMENT_BUCKET" "$DEV_SAM_BUCKET" "development"
set_secret "GOOGLE_CLIENT_ID" "$DEV_GOOGLE_CLIENT_ID" "development"
set_secret "GOOGLE_SHEETS_ID" "$DEV_GOOGLE_SHEETS_ID" "development"
set_secret "GOOGLE_CREDENTIALS" "$DEV_GOOGLE_CREDENTIALS" "development"

# Set production secrets
set_secret "AWS_ACCESS_KEY_ID_PROD" "$PROD_AWS_ACCESS_KEY_ID" "production"
set_secret "AWS_SECRET_ACCESS_KEY_PROD" "$PROD_AWS_SECRET_ACCESS_KEY" "production"
set_secret "SAM_DEPLOYMENT_BUCKET_PROD" "$PROD_SAM_BUCKET" "production"
set_secret "FRONTEND_BUCKET_PROD" "$PROD_FRONTEND_BUCKET" "production"
set_secret "GOOGLE_CLIENT_ID_PROD" "$PROD_GOOGLE_CLIENT_ID" "production"
set_secret "GOOGLE_SHEETS_ID_PROD" "$PROD_GOOGLE_SHEETS_ID" "production"
set_secret "GOOGLE_CREDENTIALS_PROD" "$PROD_GOOGLE_CREDENTIALS" "production"

echo ""
echo "✅ GitHub Secrets setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create 'dev' and 'main' branches in your repository"
echo "2. Set up GitHub Environments (development/production) in Settings"
echo "3. Push code to 'dev' branch to trigger first deployment"
echo "4. Use 'Promote Dev to Production' workflow to deploy to prod"
echo ""
echo "🔗 Manage secrets at: https://github.com/$REPO/settings/secrets/actions"