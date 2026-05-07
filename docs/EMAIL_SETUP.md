# Email Verification Setup Guide

This guide explains how to configure email providers for automatic verification emails during user signup.

## Overview

The email system uses a **factory pattern** that automatically selects the best provider based on your environment configuration:

- **Production (Vercel)**: Defaults to **Resend** (recommended)
- **Development (Local)**: Defaults to **SMTP** 
- **Auto-detection**: Prioritizes configured credentials

## Provider Comparison

| Provider | Setup Time | Cost | Best For | Reliability |
|----------|-----------|------|----------|------------|
| **Resend** | 5 min | $20/month | Cloud apps, Vercel | 99.9% |
| **SMTP (Gmail)** | 10 min | Free (your account) | Testing, small scale | Your ISP |
| **SMTP (SendGrid)** | 15 min | $20/month | Enterprise | 99.95% |
| **AWS SES** | 20 min | $0.10/1000 | High volume | 99.99% |

## Setup Instructions

### Option 1: Resend (Recommended for Production)

**Fastest setup. Free for testing, $20/month for production.**

1. **Create Resend account**
   - Visit https://resend.com
   - Sign up with your email
   - Verify email

2. **Get API Key**
   - Go to Dashboard → API Keys
   - Copy your API key (starts with `re_`)

3. **Configure environment variables**

   **Local (.env.test or .env.local)**:
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=onboarding@resend.dev
   NEXTAUTH_URL=http://localhost:3000
   ```

   **Vercel (Settings → Environment Variables)**:
   ```env
   EMAIL_PROVIDER=resend
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourapp.com
   NEXTAUTH_URL=https://yourapp.vercel.app
   ```

4. **Test**
   - Sign up with a test email
   - Check inbox for verification link

---

### Option 2: SMTP with Gmail (Testing/Small Scale)

**Free but requires App Password. Good for testing.**

1. **Enable 2-Factor Authentication** (required for App Password)
   - Go to Google Account → Security
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to Google Account → Security → App passwords
   - Select "Mail" and "Windows Computer"
   - Google will generate a 16-character password

3. **Configure environment variables**

   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   EMAIL_FROM=your-email@gmail.com
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Test**
   - Sign up with a test email
   - Check inbox for verification link

---

### Option 3: SMTP with SendGrid

**For teams. Reliable, $20/month.**

1. **Create SendGrid account**
   - Visit https://sendgrid.com
   - Sign up and verify

2. **Create API Key**
   - Go to Settings → API Keys
   - Create a key with "Mail Send" permission
   - Copy the key

3. **Configure environment variables**

   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourapp.com
   NEXTAUTH_URL=https://yourapp.vercel.app
   ```

---

### Option 4: SMTP with AWS SES

**For high volume. Pay-per-use, excellent for scaling.**

1. **Create AWS Account and set up SES**
   - Go to AWS Console → SES
   - Verify a sending domain or email address

2. **Create SMTP credentials**
   - Go to Account Dashboard → SMTP Settings
   - Click "Create My SMTP Credentials"
   - Save the generated credentials

3. **Configure environment variables**

   ```env
   EMAIL_PROVIDER=smtp
   SMTP_HOST=email-smtp.us-east-1.amazonaws.com
   SMTP_PORT=587
   SMTP_USER=AKIA_XXXXXXXXXXXXX
   SMTP_PASS=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   EMAIL_FROM=noreply@yourdomain.com
   NEXTAUTH_URL=https://yourapp.vercel.app
   ```

---

## Deployment to Vercel

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add production-ready email providers"
   git push origin master
   ```

2. **Set environment variables on Vercel**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required email variables
   - Redeploy

3. **Verify on Vercel**
   - Test signup on your production URL
   - Check spam/inbox for verification email

---

## Troubleshooting

### Email not sent?

**Check logs:**
```bash
# Local
npm run dev
# Look for "[EmailProviderFactory]" or "[Resend]" logs

# Vercel
Go to Deployments → Logs
```

### "SMTP configuration incomplete"

- Ensure all SMTP env vars are set
- No empty values
- Check for typos in variable names

### "RESEND_API_KEY is not configured"

- Verify key starts with `re_`
- Check key is correct in Vercel settings
- Redeploy after updating

### "SMTP connection verification failed"

- Test SMTP credentials manually:
  ```bash
  telnet smtp.gmail.com 587
  ```
- Verify port matches provider (Gmail = 587, AWS = 587, SendGrid = 587, Azure = 587)
- For Gmail: use App Password, not regular password

---

## Architecture

```
RegisterUserWithPasswordUseCase
  ↓
EmailSenderPort (interface)
  ↓
EmailProviderFactory
  ↓
├─ ResendEmailSenderAdapter (if RESEND_API_KEY set)
└─ SMTPEmailSenderAdapter (if SMTP_* vars set)
  ↓
sendVerificationEmail() in src/server/mailer/email.ts
  ↓
User receives email with verification link
```

## Monitoring & Alerts

For production, consider setting up:

1. **Resend Dashboard**
   - Monitor delivery rates
   - Check for bounces

2. **Email logs**
   - Check application logs for "[Resend]" or "[SMTP]" prefixes
   - Search for error messages

3. **User feedback**
   - Ask users to check spam folder
   - Monitor support emails about missing verification links

## Best Practices

1. **Always use `EMAIL_FROM` with your domain**
   - Avoid generic addresses for deliverability
   - Example: `noreply@yourapp.com` (not `noreply@resend.dev`)

2. **Keep API keys in `.gitignore`**
   - Never commit `RESEND_API_KEY` or `SMTP_PASS`
   - Use Vercel environment variables for production

3. **Test before deployment**
   - Sign up with test account locally
   - Verify email arrives
   - Check verification link works

4. **Monitor provider quotas**
   - Resend: $20/month includes unlimited emails in beta
   - AWS SES: Free tier includes 62,000/day
   - SendGrid: Starter plan = 400/day

5. **Set up email rotation (for scale)**
   - If one provider is down, automatically failover
   - See `EmailProviderFactory.ts` for adding fallbacks

---

## Support

For issues or questions:
- Resend: https://resend.com/support
- AWS SES: https://aws.amazon.com/support
- SendGrid: https://support.sendgrid.com
