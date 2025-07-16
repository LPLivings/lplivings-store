# 🚀 Production Deployment Guide

## Prerequisites

1. **Stripe Account Setup**
   - Visit https://dashboard.stripe.com
   - Complete business verification
   - Get your live API keys

2. **Domain Setup**
   - Your production domain should be ready
   - SSL certificate should be configured

## GitHub Secrets Configuration

### Required Secrets for Production

Add these to your GitHub repository secrets:

#### AWS Secrets
- `AWS_ACCESS_KEY_ID` - Your AWS access key
- `AWS_SECRET_ACCESS_KEY` - Your AWS secret key
- `AWS_REGION` - Your AWS region (e.g., us-east-1)

#### Stripe Secrets
- `STRIPE_SECRET_KEY` - Your Stripe LIVE secret key (starts with `sk_live_`)
- `STRIPE_PUBLISHABLE_KEY` - Your Stripe LIVE publishable key (starts with `pk_live_`)

#### Google Services (if using)
- `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
- `GOOGLE_SHEETS_ID` - Your Google Sheets ID
- `GOOGLE_CREDENTIALS` - Your Google service account credentials JSON

#### Admin Configuration
- `ADMIN_EMAILS` - Comma-separated list of admin emails

## Steps to Deploy to Production

### 1. Set up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and Variables → Actions

Add all the secrets listed above with your production values.

### 2. Update Environment Variables

The frontend will need the production Stripe publishable key. Update your deployment to use:

```bash
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key_here
```

### 3. Create Production Branch

```bash
git checkout -b prod
git push origin prod
```

### 4. Update GitHub Actions

Make sure your `.github/workflows/deploy.yml` handles the prod branch:

```yaml
on:
  push:
    branches: [ main, dev, prod ]
```

### 5. Deploy

Push your changes to the prod branch:

```bash
git add .
git commit -m "Prepare for production deployment"
git push origin prod
```

## Important Security Notes

⚠️ **NEVER commit live API keys to your repository**
⚠️ **Always use GitHub Secrets for sensitive data**
⚠️ **Test thoroughly before going live**
⚠️ **Monitor your Stripe dashboard for live transactions**

## Post-Deployment Checklist

- [ ] Verify Stripe webhook endpoints are configured
- [ ] Test payment flow with real card (small amount)
- [ ] Check all admin functions work
- [ ] Verify email notifications are working
- [ ] Monitor error logs
- [ ] Set up monitoring/alerting

## Testing Production

1. **Test with Real Card**
   - Use a real credit card with a small amount ($0.50)
   - Complete the full checkout flow
   - Verify payment appears in Stripe dashboard

2. **Test Apple Pay/Google Pay**
   - Use real device with real cards configured
   - Verify wallet payments work correctly

3. **Test Admin Functions**
   - Verify admin can see orders
   - Test order status updates
   - Check product management works

## Monitoring

- Monitor Stripe dashboard for failed payments
- Check CloudWatch logs for errors
- Monitor your application's health endpoints
- Set up alerts for high error rates

## Rolling Back

If you need to rollback:

```bash
git checkout dev
git push origin dev
```

This will redeploy the development version.