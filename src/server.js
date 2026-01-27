const express = require('express');
const cors = require('cors');
const path = require('path');
const { queries } = require('./db');
const { scanGmail } = require('./scanner');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes

// Get all packages
app.get('/api/packages', (req, res) => {
  try {
    const packages = queries.getAllPackages();
    res.json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active packages (not delivered)
app.get('/api/packages/active', (req, res) => {
  try {
    const packages = queries.getActivePackages();
    res.json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get packages by carrier
app.get('/api/packages/carrier/:carrier', (req, res) => {
  try {
    const packages = queries.getPackagesByCarrier(req.params.carrier);
    res.json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search packages
app.get('/api/packages/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const searchPattern = `%${query}%`;
    const packages = queries.searchPackages(searchPattern);
    res.json({ success: true, packages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update package status
app.patch('/api/packages/:trackingNumber/status', (req, res) => {
  try {
    const { status } = req.body;
    const result = queries.updatePackageStatus(status, req.params.trackingNumber);
    res.json({ success: true, package: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete package
app.delete('/api/packages/:id', (req, res) => {
  try {
    queries.deletePackage(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger scan
app.post('/api/scan', (req, res) => {
  try {
    const result = scanGmail();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get carriers list
app.get('/api/carriers', (req, res) => {
  try {
    const carriers = queries.getCarriers();
    res.json({ success: true, carriers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = queries.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n📦 Package Tracker running on http://localhost:${PORT}`);
  console.log(`📧 Monitoring: ${process.env.GOG_ACCOUNT}`);
  console.log(`\n🚀 Open http://localhost:${PORT} in your browser\n`);
});
