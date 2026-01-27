# 📦 Package Tracker

Automated package tracking dashboard that scans your Gmail for shipping notifications and displays them on a beautiful calendar interface.

## Features

✨ **Automated Email Scanning**
- Scans Gmail for shipping/delivery emails
- Supports 12+ carriers (Australian + international)
- Extracts tracking numbers and delivery dates automatically

📅 **Calendar View**
- Visual calendar showing all expected deliveries
- Color-coded by carrier
- Click any package for details

📋 **List View**
- Detailed list of all packages
- Status badges and carrier tags
- Direct links to carrier tracking pages

🔍 **Smart Filtering**
- Search by tracking number or item description
- Filter by carrier or status
- Real-time filtering

🚀 **Easy Setup**
- Connects directly to your Gmail via `gog` CLI
- Auto-refresh every 30 minutes
- One-click manual scan

## Supported Carriers

**Australian:**
- Australia Post
- StarTrack
- Toll / Toll IPEC
- Aramex
- CouriersPlease
- DHL Express Australia
- FedEx Australia
- TNT Australia
- Sendle

**International:**
- Amazon
- AliExpress
- eBay

## Prerequisites

- Node.js 16+ installed
- `gog` CLI installed and authenticated
- Gmail account with shipping emails

## Quick Start

### 1. Install Dependencies

```bash
cd package-tracker
npm install
```

### 2. Configure

The `.env` file is already set up with your email:

```env
PORT=3000
GOG_ACCOUNT=petarceklic@gmail.com
SCAN_DAYS_BACK=90
AUTO_REFRESH_MINUTES=30
```

### 3. Scan Your Inbox

```bash
npm run scan
```

This will:
- Search your Gmail for shipping emails from the last 90 days
- Extract tracking numbers and delivery dates
- Store everything in a local SQLite database

### 4. Start the Dashboard

```bash
npm start
```

Then open: **http://localhost:3000**

## Usage

### Manual Scan
Click the "🔄 Scan Inbox" button in the dashboard to run a fresh scan anytime.

### Switch Views
Toggle between Calendar and List views using the button in the header.

### Search & Filter
- Use the search bar to find specific packages
- Filter by carrier or status
- Click any package for full details
- Click tracking numbers to open carrier websites

### Package Status
Packages are automatically assigned "In Transit" status. You can manually update:
- In Transit
- Out for Delivery
- Delivered
- Delayed
- Cancelled

## Project Structure

```
package-tracker/
├── src/
│   ├── server.js      # Express API server
│   ├── scanner.js     # Gmail scanning & parsing logic
│   └── db.js          # SQLite database setup
├── public/
│   ├── index.html     # Main dashboard UI
│   └── js/
│       └── app.js     # Frontend logic
├── data/
│   └── packages.db    # SQLite database (auto-created)
├── .env               # Configuration
└── package.json       # Dependencies
```

## API Endpoints

- `GET /api/packages` - Get all packages
- `GET /api/packages/active` - Get active packages only
- `GET /api/packages/carrier/:carrier` - Filter by carrier
- `GET /api/packages/search?q=query` - Search packages
- `GET /api/carriers` - Get list of carriers
- `GET /api/stats` - Get package statistics
- `POST /api/scan` - Trigger Gmail scan
- `PATCH /api/packages/:trackingNumber/status` - Update status
- `DELETE /api/packages/:id` - Delete package

## Development

Run with auto-reload:

```bash
npm run dev
```

## How It Works

1. **Email Scanning**: Uses `gog gmail search` to find emails containing shipping keywords
2. **Parsing**: Regex patterns extract tracking numbers from email bodies and subjects
3. **Carrier Detection**: Identifies carrier from email domain and content
4. **Date Extraction**: Finds estimated delivery dates using multiple date patterns
5. **Storage**: Stores in SQLite for fast querying
6. **Display**: Serves via Express + FullCalendar for visualization

## Customization

### Add More Carriers

Edit `src/scanner.js` and add to the `CARRIERS` object:

```javascript
'Your Carrier': {
  domains: ['carrier.com'],
  patterns: [/tracking.*?(\d{10,})/i],
  trackingUrl: 'https://carrier.com/track?id='
}
```

### Adjust Scan Range

Change `SCAN_DAYS_BACK` in `.env` (default: 90 days)

### Auto-Refresh Interval

Change `AUTO_REFRESH_MINUTES` in `.env` (default: 30 minutes)

## Troubleshooting

**No packages found?**
- Run `npm run scan` manually
- Check `gog auth list` to verify Gmail access
- Increase `SCAN_DAYS_BACK` in `.env`

**Scanner not finding tracking numbers?**
- Some carriers use unique formats
- Check `src/scanner.js` patterns for your carrier
- Email bodies may need better regex patterns

**Port already in use?**
- Change `PORT` in `.env`
- Kill existing process: `lsof -ti:3000 | xargs kill`

## Built With

- **Backend**: Express.js, better-sqlite3
- **Frontend**: FullCalendar, Tailwind CSS
- **Email**: gog CLI (Google Workspace)

## License

MIT

---

**Built overnight by Mia 😏💅**
