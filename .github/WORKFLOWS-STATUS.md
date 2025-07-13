# GitHub Actions Workflows Status

## Active Workflows

### ✅ `deploy-dev-unified.yml` - **ACTIVE**
- **Purpose**: Main development deployment workflow
- **Triggers**: Push to `dev` branch
- **Features**: 
  - Deploys both backend (SAM) and frontend (React)
  - Handles Google Credentials properly
  - Non-blocking backend deployment (continues to frontend even if backend unchanged)
  - Includes build info injection (SHA, timestamp, branch)
  - Comprehensive error handling and logging

## Disabled Workflows

### ❌ `deploy-dev.yml` - **DISABLED**
- **Reason**: Had issues with Google Credentials JSON formatting and complex parameter handling
- **Status**: Manual trigger only (`workflow_dispatch`)

### ❌ `deploy-dev-working.yml` - **DISABLED** 
- **Reason**: Replaced by unified workflow
- **Status**: Manual trigger only (`workflow_dispatch`)

### ❌ `deploy-frontend-only.yml` - **DISABLED**
- **Reason**: Was temporary solution, unified workflow handles both frontend and backend
- **Status**: Manual trigger only (`workflow_dispatch`)

### ❌ `deploy-dev-simple.yml` - **DISABLED**
- **Reason**: Testing workflow only, doesn't actually deploy
- **Status**: Manual trigger only (`workflow_dispatch`)

## Production Workflows

### 🚀 `deploy.yml` - **PRODUCTION**
- **Purpose**: Production deployment for `main` branch
- **Status**: Active for main branch

### 🚀 `deploy-prod.yml` - **PRODUCTION** 
- **Purpose**: Alternative production deployment
- **Status**: Check configuration

### 🚀 `promote-to-prod.yml` - **PRODUCTION**
- **Purpose**: Promotes dev to production
- **Status**: Manual workflow

## Recommendations

1. **Keep active**: `deploy-dev-unified.yml` - working perfectly
2. **Consider removing**: Disabled dev workflows can be deleted to reduce clutter
3. **Review production**: Ensure production workflows are properly configured

## Current Development Flow

```
Code changes → Push to dev → deploy-dev-unified.yml → AWS Lambda + S3
```

This ensures all changes (AI features, UI improvements, build info) are deployed together.