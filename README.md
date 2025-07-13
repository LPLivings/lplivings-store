# E-Commerce Mobile App

A mobile-friendly React application with Python Lambda backend for crowdsourced inventory management.

## Architecture

- **Frontend**: React (Mobile-responsive) hosted on AWS Amplify
- **Backend**: Python Lambda functions with API Gateway
- **Authentication**: Gmail OAuth 2.0
- **Storage**: S3 for images, Google Sheets for data
- **CI/CD**: GitHub Actions for dev/prod deployments

## Project Structure

```
ecommerce-app/
├── frontend/          # React application
├── backend/           # Python Lambda functions
├── infrastructure/    # AWS CloudFormation/SAM templates
└── .github/workflows/ # GitHub Actions CI/CD
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- AWS CLI configured
- Google Cloud credentials for Sheets API

### Development Setup

1. Frontend:
```bash
cd frontend
npm install
npm start
```

2. Backend:
```bash
cd backend
pip install -r requirements.txt
sam local start-api
```

## Deployment

Deployments are automated via GitHub Actions:
- Push to `dev` branch → Deploy to development environment
- Push to `main` branch → Deploy to production environment