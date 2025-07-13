# 🚀 Quick Start Guide

## Overview
This is a complete mobile-friendly e-commerce app with:
- **Frontend**: React with Material-UI (mobile-responsive)
- **Backend**: AWS Lambda + API Gateway  
- **Auth**: Google OAuth 2.0
- **Storage**: S3 (images) + Google Sheets (data)
- **Deploy**: AWS Amplify + GitHub Actions CI/CD

## 🎯 One-Command Setup

```bash
cd ecommerce-app/infrastructure
python master-setup.py
```

This will guide you through everything! But here's what you need to prepare first:

---

## 📋 Before You Start

### 1. Google Cloud Console Setup (5 minutes)

1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Create project** named `ecommerce-app`
3. **Enable APIs**: Google Sheets API + Google Drive API
4. **Create OAuth Client**:
   - Type: Web application
   - Origins: `http://localhost:3000`
   - **Save the Client ID** 📝
5. **Create Service Account**:
   - Name: `ecommerce-sheets-service`
   - Download JSON key file 📁

### 2. Google Sheets Setup (2 minutes)

1. **Create new spreadsheet** at [sheets.google.com](https://sheets.google.com)
2. **Name it**: `E-Commerce App Data`
3. **Get the ID** from URL (long string between `/d/` and `/edit`) 📝
4. **Share with service account email** (from JSON file) with Editor access

### 3. Run the Setup Script

```bash
cd ecommerce-app/infrastructure
python master-setup.py
```

**You'll need**:
- Google OAuth Client ID
- Google Spreadsheet ID  
- Path to your service account JSON file

---

## 🧪 Test Locally

After setup, test everything works:

```bash
# Terminal 1 - Frontend
cd frontend
npm start

# Terminal 2 - Backend  
cd backend
source venv/bin/activate
sam local start-api --env-vars env.json
```

Visit: http://localhost:3000

---

## ☁️ Deploy to AWS

### 1. AWS Setup
Follow the guide in `infrastructure/aws-setup-guide.md`

### 2. GitHub Setup
1. Push to GitHub
2. Add secrets from `github-secrets-template.json` to your repo
3. Push to `main` branch → Auto-deploy to production!

---

## 📱 Features

- **Mobile-first design** with bottom navigation
- **Google login** with profile management
- **Product browsing** with search and filters
- **Shopping cart** with persistent storage
- **Add products** with image upload
- **Crowdsourced inventory** - anyone can contribute
- **Real-time data** via Google Sheets

---

## 🆘 Need Help?

**Most common issues**:

1. **"Google login doesn't work"**  
   → Check OAuth Client ID in frontend/.env

2. **"Can't connect to backend"**  
   → Make sure SAM local is running on port 3001

3. **"Sheets access denied"**  
   → Check service account has Editor access to spreadsheet

4. **"Dependencies missing"**  
   → Run the master-setup.py script again

**Full documentation**: See `DEPLOYMENT.md` for detailed guides

---

## 🎉 You're Done!

Your app is now ready for:
- ✅ Local development
- ✅ Production deployment
- ✅ Mobile users
- ✅ Real e-commerce functionality

Happy coding! 🚀