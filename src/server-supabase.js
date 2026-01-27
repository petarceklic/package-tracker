const express = require('express');
const cors = require('cors');
const path = require('path');
const { queries } = require('./db-supabase');
const { scanGmailFast } = require('./scanner-optimized');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes

// Get all packages
app.get('/api/packages', async (req, res) => {
  try {
    const packages = await queries.getAllPackages();
    res.json({ success: true, packages });
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active packages (not delivered)
app.get('/api/packages/active', async (req, res) => {
  try {
    const packages = await queries.getActivePackages();
    res.json({ success: true, packages });
  } catch (error) {
    console.error('Error fetching active packages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get packages by carrier
app.get('/api/packages/carrier/:carrier', async (req, res) => {
  try {
    const packages = await queries.getPackagesByCarrier(req.params.carrier);
    res.json({ success: true, packages });
  } catch (error) {
    console.error('Error fetching packages by carrier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Search packages
app.get('/api/packages/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const packages = await queries.searchPackages(query);
    res.json({ success: true, packages });
  } catch (error) {
    console.error('Error searching packages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update package status
app.patch('/api/packages/:trackingNumber/status', async (req, res) => {
  try {
    const { status } = req.body;
    const result = await queries.updatePackageStatus(status, req.params.trackingNumber);
    res.json({ success: true, package: result });
  } catch (error) {
    console.error('Error updating package status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete package
app.delete('/api/packages/:id', async (req, res) => {
  try {
    await queries.deletePackage(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting package:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger scan
app.post('/api/scan', async (req, res) => {
  try {
    console.log('Starting Gmail scan...');
    const result = await scanGmailFast();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error scanning Gmail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get carriers list
app.get('/api/carriers', async (req, res) => {
  try {
    const carriers = await queries.getCarriers();
    res.json({ success: true, carriers });
  } catch (error) {
    console.error('Error fetching carriers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await queries.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n📦 Package Tracker running on port ${PORT}`);
  console.log(`📧 Monitoring: ${process.env.GOG_ACCOUNT}`);
  console.log(`🔗 Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`\n✅ Server ready!\n`);
});
