#!/bin/bash
# Package Tracker - Daily Gmail Scan Script
# Run at 3 AM daily via cron

# Set the working directory
cd /Users/clawd/clawd/package-tracker

# Load environment variables
source .env

# Log file
LOG_FILE="/Users/clawd/clawd/package-tracker/logs/scan-$(date +%Y-%m-%d).log"
mkdir -p /Users/clawd/clawd/package-tracker/logs

echo "========================================" >> "$LOG_FILE"
echo "Package Tracker Scan - $(date)" >> "$LOG_FILE"
echo "========================================" >> "$LOG_FILE"

# Run the scanner
/opt/homebrew/bin/node src/scanner-supabase.js >> "$LOG_FILE" 2>&1

echo "" >> "$LOG_FILE"
echo "Scan completed at $(date)" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Keep only last 30 days of logs
find /Users/clawd/clawd/package-tracker/logs -name "scan-*.log" -mtime +30 -delete
