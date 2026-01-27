# 🚀 Quick Start - Get Your Package Tracker Live!

## Step 1: Set Up Supabase Database (2 minutes)

1. **Open Supabase SQL Editor:**
   👉 https://supabase.com/dashboard/project/kgroucyfrquxgbwukkqs/sql/new

2. **Copy this SQL and paste it in the editor:**

```sql
-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id BIGSERIAL PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  carrier TEXT NOT NULL,
  status TEXT DEFAULT 'In Transit',
  estimated_delivery DATE,
  item_description TEXT,
  email_subject TEXT,
  email_date TEXT,
  tracking_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_packages_tracking_number ON packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_carrier ON packages(carrier);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_estimated_delivery ON packages(estimated_delivery);

-- Enable RLS (security)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Allow all operations (you can make this more restrictive later)
CREATE POLICY "Allow all operations" ON packages FOR ALL USING (true) WITH CHECK (true);
```

3. **Click "Run"** ✅

---

## Step 2: Deploy to Railway (3 minutes)

1. **Go to Railway:** https://railway.app/new

2. **Click "Deploy from GitHub repo"**

3. **Select:** `petarceklic/package-tracker`

4. **Add Environment Variables** (in Railway project settings):
   ```
   PORT=3000
   SUPABASE_URL=https://kgroucyfrquxgbwukkqs.supabase.co
   SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtncm91Y3lmcnF1eGdid3Vra3FzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5NDc2NDcsImV4cCI6MjA1MzUyMzY0N30.GMEvtgR83viIi6HMQqI2SA_31Hf1RKd
   GOG_ACCOUNT=petarceklic@gmail.com
   SCAN_DAYS_BACK=90
   ```

5. **Click "Deploy"** - Railway will build and deploy automatically!

6. **Get your public URL** from Settings → Networking → Generate Domain

---

## Step 3: Set Up Daily Scans (1 minute)

**Option A: Run from Mac Mini (Recommended)**

Your Mac mini already has gog CLI set up. Add this cron job:

```bash
crontab -e
```

Add this line:
```
0 3 * * * cd ~/clawd/package-tracker && /usr/local/bin/node src/scanner-supabase.js >> ~/clawd/package-tracker/scanner.log 2>&1
```

This runs the scanner at 3 AM daily and logs output.

**Option B: Manual Trigger**

Visit your Railway URL and click the "🔄 Scan Inbox" button whenever you want to scan!

---

## Step 4: Test It!

1. Visit your Railway URL (e.g., `your-app.railway.app`)
2. Click **"🔄 Scan Inbox"**
3. Watch packages appear! 📦
4. Share the URL with your wife 😏

---

## Troubleshooting

**No packages showing up?**
- Click "Scan Inbox" to fetch emails
- Check that gog CLI is authenticated: `gog auth list`
- Verify Supabase table was created (check SQL Editor)

**Deployment failed?**
- Check Railway build logs
- Verify environment variables are set correctly
- Make sure GitHub repo is public or Railway has access

**Scanner not working?**
- gog CLI only works on Mac mini (needs OAuth)
- Railway serves the web UI, Mac mini scans Gmail
- Set up cron job on Mac to run scanner daily

---

**That's it! 🎉 Your package tracker is live!**

Built with 💅 by Mia
