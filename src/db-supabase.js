const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Check if columns exist (cached)
let columnsChecked = false;
let hasNewColumns = false;

async function checkNewColumns() {
  if (columnsChecked) return hasNewColumns;
  try {
    const { data, error } = await supabase.from('packages').select('delivered_at, email_account').limit(1);
    hasNewColumns = !error;
    columnsChecked = true;
    if (!hasNewColumns) {
      console.log('Note: New columns (delivered_at, email_account) not yet added to Supabase.');
      console.log('Run this SQL in Supabase dashboard:');
      console.log('ALTER TABLE packages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;');
      console.log('ALTER TABLE packages ADD COLUMN IF NOT EXISTS email_account TEXT;');
    }
  } catch (e) {
    hasNewColumns = false;
    columnsChecked = true;
  }
  return hasNewColumns;
}

const queries = {
  insertPackage: async (trackingNumber, carrier, status, estimatedDelivery, itemDescription, emailSubject, emailDate, trackingUrl, emailAccount = null, deliveredAt = null) => {
    // Check if package already exists
    const { data: existing } = await supabase
      .from('packages')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single();

    const packageData = {
      tracking_number: trackingNumber,
      carrier,
      status,
      estimated_delivery: estimatedDelivery,
      item_description: itemDescription,
      email_subject: emailSubject,
      email_date: emailDate,
      tracking_url: trackingUrl,
      updated_at: new Date().toISOString()
    };

    // Only add new columns if they exist in the database
    const canUseNewColumns = await checkNewColumns();
    if (canUseNewColumns) {
      if (emailAccount) {
        packageData.email_account = emailAccount;
      }
      if (status === 'Delivered' && deliveredAt) {
        packageData.delivered_at = deliveredAt;
      }
    }

    if (existing) {
      // Don't overwrite email_account if already set
      if (canUseNewColumns && existing.email_account && !emailAccount) {
        delete packageData.email_account;
      }
      // Don't overwrite delivered_at if already set
      if (canUseNewColumns && existing.delivered_at) {
        delete packageData.delivered_at;
      }
      // Never downgrade status: Delivered > Out for Delivery > In Transit
      const STATUS_RANK = { 'Delivered': 3, 'Out for Delivery': 2, 'In Transit': 1, 'Delayed': 1, 'Cancelled': 0 };
      const existingRank = STATUS_RANK[existing.status] || 0;
      const newRank = STATUS_RANK[status] || 0;
      if (newRank < existingRank) {
        // Keep the higher-ranked status AND its date — the more recent
        // status update had the more authoritative delivery date
        packageData.status = existing.status;
        if (existing.estimated_delivery) {
          packageData.estimated_delivery = existing.estimated_delivery;
        }
      }

      // Update existing package
      const { data, error } = await supabase
        .from('packages')
        .update(packageData)
        .eq('tracking_number', trackingNumber)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new package
      const { data, error } = await supabase
        .from('packages')
        .insert([packageData])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },
  
  getAllPackages: async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .order('estimated_delivery', { ascending: false, nullsLast: true });
    
    if (error) throw error;
    return data || [];
  },
  
  getActivePackages: async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .not('status', 'in', '("Delivered","Cancelled")')
      .order('estimated_delivery', { ascending: true, nullsLast: true });
    
    if (error) throw error;
    return data || [];
  },
  
  getPackagesByCarrier: async (carrier) => {
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .eq('carrier', carrier)
      .order('estimated_delivery', { ascending: false, nullsLast: true });
    
    if (error) throw error;
    return data || [];
  },
  
  updatePackageStatus: async (status, trackingNumber) => {
    const updateData = { status, updated_at: new Date().toISOString() };

    // Set delivered_at timestamp when marking as delivered (if column exists)
    const canUseNewColumns = await checkNewColumns();
    if (status === 'Delivered' && canUseNewColumns) {
      updateData.delivered_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('packages')
      .update(updateData)
      .eq('tracking_number', trackingNumber)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
  
  deletePackage: async (id) => {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
  
  searchPackages: async (searchPattern) => {
    const pattern = `%${searchPattern.replace(/%/g, '')}%`;
    
    const { data, error } = await supabase
      .from('packages')
      .select('*')
      .or(`tracking_number.ilike.${pattern},item_description.ilike.${pattern},email_subject.ilike.${pattern}`)
      .order('estimated_delivery', { ascending: false, nullsLast: true });
    
    if (error) throw error;
    return data || [];
  },
  
  getCarriers: async () => {
    const { data, error } = await supabase
      .from('packages')
      .select('carrier')
      .order('carrier');
    
    if (error) throw error;
    
    const carriers = [...new Set(data.map(p => p.carrier))];
    return carriers.sort();
  },
  
  getStats: async () => {
    const { data: all, error: allError } = await supabase
      .from('packages')
      .select('id, status');
    
    if (allError) throw allError;
    
    return {
      total: all.length,
      active: all.filter(p => !['Delivered', 'Cancelled'].includes(p.status)).length,
      delivered: all.filter(p => p.status === 'Delivered').length
    };
  }
};

module.exports = { queries, supabase };
