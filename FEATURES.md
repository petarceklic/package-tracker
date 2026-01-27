# 📦 Package Tracker - Features Overview

## 🎯 What You Get

A fully automated package tracking dashboard that monitors your Gmail and displays all your deliveries on a beautiful calendar interface.

## ✨ Key Features

### 1. Automated Email Scanning 📧
- Scans your Gmail for shipping notifications
- Covers 90 days of email history (configurable)
- Supports 12+ carriers:
  - **Australian**: Australia Post, StarTrack, Toll, Aramex, CouriersPlease, DHL, FedEx, TNT, Sendle
  - **International**: Amazon, AliExpress, eBay
- Auto-detects carriers from email domains
- Extracts tracking numbers using smart regex patterns
- Parses delivery dates automatically

### 2. Dual View Modes 👀

#### Calendar View 📅
- Full month/week calendar layout
- Color-coded events by carrier
- Shows expected delivery dates
- Click any package for full details
- Visual overview of what's coming when

#### List View 📋
- Detailed card layout for each package
- Status badges (In Transit, Out for Delivery, Delivered, etc.)
- Carrier tags
- One-click tracking links
- Item descriptions
- Email metadata

### 3. Smart Search & Filters 🔍
- **Search**: Find packages by tracking number, item description, or email subject
- **Carrier Filter**: Show only specific carriers
- **Status Filter**: Filter by delivery status
- Real-time filtering as you type

### 4. One-Click Tracking 🔗
- Tracking numbers are clickable
- Opens carrier's tracking page in new tab
- Direct links to:
  - Australia Post tracking
  - Amazon order details
  - eBay shipment tracking
  - And all other supported carriers

### 5. Package Details Modal 📦
- Click any package for full info:
  - Item description
  - Carrier and status
  - Tracking number
  - Expected delivery date
  - Original email details
  - Quick link to carrier tracking

### 6. Statistics Dashboard 📊
- Total packages tracked
- Active packages in transit
- Delivered packages count
- Real-time updates

### 7. Manual Refresh 🔄
- "Scan Inbox" button for on-demand Gmail scanning
- Shows scan results (X emails scanned, Y packages found)
- Updates dashboard immediately

### 8. Auto-Refresh ⏰
- Dashboard auto-refreshes every 30 minutes
- Keeps data fresh without manual intervention
- Configurable refresh interval

### 9. Mobile Responsive 📱
- Fully responsive design
- Works on desktop, tablet, and mobile
- Touch-friendly interface
- Tailwind CSS for modern styling

### 10. Local Data Storage 💾
- Stores packages in local JSON database
- Fast queries and updates
- No external database required
- Easy to backup and migrate

## 🛠️ Tech Stack

**Backend:**
- Node.js + Express
- RESTful API
- Gmail integration via `gog` CLI
- JSON file storage

**Frontend:**
- FullCalendar for calendar widget
- Tailwind CSS for styling
- Vanilla JavaScript (no framework bloat)
- CDN-based dependencies (no build step)

## 🎨 Design Philosophy

- **Clean & Modern**: Minimalist interface with focus on usability
- **Fast**: Lightweight, no heavy frameworks
- **Simple**: Easy to understand and modify
- **Practical**: Built for daily use, not just demo purposes

## 🔧 Customization Options

All configurable via `.env`:
- Port number
- Gmail account
- Scan history range (days)
- Auto-refresh interval

Easy to add more carriers by editing `src/scanner.js`.

## 📈 Future Enhancement Ideas

- Status auto-updates (poll carrier APIs)
- Delivery notifications
- Archive delivered packages
- Export to CSV/PDF
- Multi-account support
- Mobile app wrapper
- Push notifications

---

**Current Status**: ✅ Fully functional and ready to use!
