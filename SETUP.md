# 🚀 Quick Setup Guide

## Step 1: Open Terminal

Navigate to the package-tracker folder:

```bash
cd package-tracker
```

## Step 2: Run the startup script

```bash
./start.sh
```

This will:
- Check if `gog` is installed and authenticated
- Install dependencies (if needed)
- Run an initial Gmail scan (if database is empty)
- Start the dashboard server

## Step 3: Open the Dashboard

Once the server starts, open your browser to:

**http://localhost:3000**

## That's It! 🎉

The dashboard will show:
- 📅 Calendar view with all your expected deliveries
- 📋 Detailed list of packages
- 🔍 Search and filter functionality
- 🔄 Manual scan button to refresh from Gmail

---

## Manual Commands

If you prefer to run commands manually:

### Scan Gmail for new packages
```bash
npm run scan
```

### Start the server
```bash
npm start
```

### Development mode (auto-reload)
```bash
npm run dev
```

---

## Troubleshooting

**"gog is not installed"**
```bash
brew install steipete/tap/gogcli
```

**"gog is not authenticated"**
```bash
gog auth add your-email@gmail.com --services gmail
```

**"Port 3000 already in use"**

Edit `.env` and change `PORT=3000` to a different port.

---

**Need help?** Check the main README.md for full documentation.
