const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'packages.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize empty database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({ packages: [] }, null, 2));
}

function readDB() {
  const data = fs.readFileSync(dbPath, 'utf8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const queries = {
  insertPackage: (trackingNumber, carrier, status, estimatedDelivery, itemDescription, emailSubject, emailDate, trackingUrl) => {
    const db = readDB();
    
    // Check if package already exists
    const existingIndex = db.packages.findIndex(p => p.tracking_number === trackingNumber);
    
    const packageData = {
      id: existingIndex >= 0 ? db.packages[existingIndex].id : Date.now(),
      tracking_number: trackingNumber,
      carrier,
      status,
      estimated_delivery: estimatedDelivery,
      item_description: itemDescription,
      email_subject: emailSubject,
      email_date: emailDate,
      tracking_url: trackingUrl,
      created_at: existingIndex >= 0 ? db.packages[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    if (existingIndex >= 0) {
      db.packages[existingIndex] = packageData;
    } else {
      db.packages.push(packageData);
    }
    
    writeDB(db);
    return packageData;
  },
  
  getAllPackages: () => {
    const db = readDB();
    return db.packages.sort((a, b) => {
      const dateA = new Date(a.estimated_delivery || a.created_at);
      const dateB = new Date(b.estimated_delivery || b.created_at);
      return dateB - dateA;
    });
  },
  
  getActivePackages: () => {
    const db = readDB();
    return db.packages
      .filter(p => !['Delivered', 'Cancelled'].includes(p.status))
      .sort((a, b) => {
        const dateA = new Date(a.estimated_delivery || '2099-12-31');
        const dateB = new Date(b.estimated_delivery || '2099-12-31');
        return dateA - dateB;
      });
  },
  
  getPackagesByCarrier: (carrier) => {
    const db = readDB();
    return db.packages
      .filter(p => p.carrier === carrier)
      .sort((a, b) => {
        const dateA = new Date(a.estimated_delivery || a.created_at);
        const dateB = new Date(b.estimated_delivery || b.created_at);
        return dateB - dateA;
      });
  },
  
  updatePackageStatus: (status, trackingNumber) => {
    const db = readDB();
    const packageIndex = db.packages.findIndex(p => p.tracking_number === trackingNumber);
    
    if (packageIndex >= 0) {
      db.packages[packageIndex].status = status;
      db.packages[packageIndex].updated_at = new Date().toISOString();
      writeDB(db);
      return db.packages[packageIndex];
    }
    return null;
  },
  
  deletePackage: (id) => {
    const db = readDB();
    db.packages = db.packages.filter(p => p.id !== parseInt(id));
    writeDB(db);
  },
  
  searchPackages: (searchPattern) => {
    const db = readDB();
    const pattern = searchPattern.replace(/%/g, '').toLowerCase();
    
    return db.packages.filter(p => 
      (p.tracking_number && p.tracking_number.toLowerCase().includes(pattern)) ||
      (p.item_description && p.item_description.toLowerCase().includes(pattern)) ||
      (p.email_subject && p.email_subject.toLowerCase().includes(pattern))
    ).sort((a, b) => {
      const dateA = new Date(a.estimated_delivery || a.created_at);
      const dateB = new Date(b.estimated_delivery || b.created_at);
      return dateB - dateA;
    });
  },
  
  getCarriers: () => {
    const db = readDB();
    const carriers = [...new Set(db.packages.map(p => p.carrier))];
    return carriers.sort();
  },
  
  getStats: () => {
    const db = readDB();
    return {
      total: db.packages.length,
      active: db.packages.filter(p => !['Delivered', 'Cancelled'].includes(p.status)).length,
      delivered: db.packages.filter(p => p.status === 'Delivered').length
    };
  }
};

module.exports = { queries };
