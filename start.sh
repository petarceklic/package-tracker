#!/bin/bash
# Package Tracker Startup Script

echo "📦 Starting Package Tracker..."
echo ""

# Check if gog is installed
if ! command -v gog &> /dev/null; then
    echo "❌ Error: 'gog' CLI is not installed or not in PATH"
    echo "Install: brew install steipete/tap/gogcli"
    exit 1
fi

# Check if gog is authenticated
if ! gog auth list &> /dev/null; then
    echo "❌ Error: 'gog' is not authenticated"
    echo "Run: gog auth add your-email@gmail.com --services gmail"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    npm install
fi

# Run initial scan if database is empty
if [ ! -f "data/packages.json" ] || [ $(cat data/packages.json | grep -c '"packages": \[\]') -eq 1 ]; then
    echo "🔍 Running initial Gmail scan..."
    npm run scan
fi

# Start the server
echo ""
echo "🚀 Starting dashboard..."
npm start
