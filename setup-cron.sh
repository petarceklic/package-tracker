#!/bin/bash

# Add cron job for daily 3 AM Gmail scans
echo "Setting up daily package scanner cron job..."

# Create cron entry
CRON_CMD="0 3 * * * cd $HOME/clawd/package-tracker && /usr/local/bin/node src/scanner-supabase.js >> $HOME/clawd/package-tracker/scanner.log 2>&1"

# Check if crontab exists and add entry
(crontab -l 2>/dev/null | grep -v "scanner-supabase.js"; echo "$CRON_CMD") | crontab -

echo "✅ Cron job added!"
echo "📅 Scanner will run daily at 3:00 AM"
echo "📝 Logs: ~/clawd/package-tracker/scanner.log"
echo ""
echo "To verify: crontab -l"
