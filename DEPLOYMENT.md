# 🚀 Deployment Guide

## Prerequisites

✅ Supabase account & project
✅ Railway account (connected to GitHub)
✅ GitHub repository

## Step 1: Set Up Supabase Database

1. Go to your Supabase project: https://kgroucyfrquxgbwukkqs.supabase.co
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase-schema.sql`
4. Run the query to create the `packages` table with indexes and RLS policies

## Step 2: Push Code to GitHub

```bash
cd package-tracker
git init
git add .
git commit -m "Initial commit - Cloud package tracker with Supabase"
git branch -M main
git remote add origin https://github.com/petarceklic/package-tracker.git
git push -u origin main
```

## Step 3: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **petarceklic/package-tracker**
5. Railway will auto-detect Node.js and deploy

## Step 4: Configure Environment Variables

In Railway project settings, add these variables:

```
PORT=3000
SUPABASE_URL=https://kgroucyfrquxgbwukkqs.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtncm91Y3lmcnF1eGdid3Vra3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NDc2NDcsImV4cCI6MjA1MzUyMzY0N30.GMEvtgR83viIi6HMQqI2SA_31Hf1RKd
GOG_ACCOUNT=petarceklic@gmail.com
SCAN_DAYS_BACK=90
```

## Step 5: Set Up Daily Cron (3 AM Scans)

Railway doesn't have built-in cron. Two options:

### Option A: Use Railway Cron Plugin
1. In your Railway project, click **"+ New"**
2. Add **"Cron Job"** plugin
3. Schedule: `0 3 * * *` (3 AM daily)
4. Command: `npm run scan`

### Option B: External Cron Service
Use [cron-job.org](https://cron-job.org) or similar:
1. Create account
2. Add job: `POST https://your-railway-url.railway.app/api/scan`
3. Schedule: Daily at 3:00 AM GMT+8

### Option C: Use Mac Mini (Recommended)
Since gog CLI is on your Mac mini, run cron there:

```bash
crontab -e
```

Add this line:
```
0 3 * * * cd ~/clawd/package-tracker && /usr/local/bin/node src/scanner-supabase.js
```

## Step 6: Generate Public URL

Railway automatically generates a public URL. Find it in:
- Project Settings → Domains
- Should look like: `your-app.railway.app`

## Testing

1. Visit your Railway URL
2. Click **"🔄 Scan Inbox"** to test scanner
3. Check Supabase dashboard to verify data is being stored
4. Share URL with your wife!

## Monitoring

- **Railway Logs**: Check deployment logs in Railway dashboard
- **Supabase Logs**: View database queries in Supabase dashboard
- **Health Check**: Visit `/health` endpoint to verify server is running

## Troubleshooting

**Scanner fails on Railway?**
- gog CLI won't work in Railway (needs OAuth)
- Run scanner from Mac mini via cron instead
- Railway serves the web UI, Mac scans Gmail

**Database connection errors?**
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in Railway env vars
- Check Supabase project is active
- Verify RLS policies allow access

**Deployment fails?**
- Check Railway build logs
- Verify `package.json` dependencies
- Make sure Node.js 16+ is specified in engines

---

**Built with 💅 by Mia**
