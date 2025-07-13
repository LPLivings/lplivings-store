# LPLivings Store - E-commerce Application

A modern e-commerce platform built with React frontend and AWS serverless backend, featuring Google OAuth authentication and Google Sheets integration.

## 🚀 Features

- **Frontend**: React with Material-UI, TypeScript
- **Backend**: AWS Lambda, API Gateway, S3
- **Authentication**: Google OAuth 2.0
- **Data Storage**: Google Sheets integration
- **Image Storage**: AWS S3 with public access
- **CI/CD**: GitHub Actions with dev/prod environments

## 🏗️ Architecture

### Frontend
- React 18 with TypeScript
- Material-UI for components
- Zustand for state management
- React Query for API calls
- React Router for navigation

### Backend  
- AWS Lambda functions (Python 3.9)
- API Gateway for REST endpoints
- S3 for static website hosting and image storage
- CloudFormation/SAM for infrastructure

### Integrations
- Google OAuth for user authentication
- Google Sheets for product/order data
- AWS services for hosting and storage

## 📁 Project Structure

```
ecommerce-app/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components  
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   └── App.tsx
│   ├── package.json
│   └── tsconfig.json
├── backend/                  # AWS Lambda backend
│   ├── lambda_functions/    # Lambda function code
│   ├── template.yaml        # SAM template
│   ├── env.*.json          # Environment configs
│   └── requirements.txt
├── .github/workflows/       # CI/CD pipelines
│   ├── deploy-dev.yml      # Development deployment
│   ├── deploy-prod.yml     # Production deployment
│   └── promote-to-prod.yml # Promotion workflow
├── scripts/                 # Setup scripts
└── infrastructure/          # Infrastructure scripts
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+
- Python 3.9+
- AWS CLI
- SAM CLI
- GitHub CLI (for secrets setup)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ecommerce-app
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your values
   npm start
   ```

3. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Local testing with SAM
   sam build
   sam local start-api --env-vars env.dev.json
   ```

### Cloud Deployment

#### Quick Setup
1. Run the setup script:
   ```bash
   ./scripts/setup-with-new-user.sh
   ```

2. Set up GitHub secrets:
   ```bash
   ./scripts/setup-github-secrets.sh
   ```

3. Push to dev branch to trigger deployment:
   ```bash
   git checkout -b dev
   git push origin dev
   ```

## 🔄 CI/CD Workflows

### Development Environment
- **Trigger**: Push to `dev` branch
- **Process**: Auto-deploy backend and frontend
- **URL**: Temporary S3 website URL

### Production Environment  
- **Trigger**: Push to `main` branch or manual dispatch
- **Process**: Deploy with confirmation step
- **URL**: Production S3 website URL

### Promotion Workflow
- **Trigger**: Manual workflow dispatch
- **Process**: 
  1. Run tests on source branch
  2. Merge to main branch
  3. Create release tag
  4. Trigger production deployment

## 🌐 Current Deployment

- **Frontend**: http://lplivings-frontend-1752392892.s3-website-us-east-1.amazonaws.com
- **Backend API**: https://5pyjyltkoa.execute-api.us-east-1.amazonaws.com/dev

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT.md)
- [CI/CD Setup](CICD-SETUP.md)
- [Quick Start](QUICK-START.md)