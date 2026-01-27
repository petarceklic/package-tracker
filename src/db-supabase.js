const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const queries = {
  insertPackage: async (trackingNumber, carrier, status, estimatedDelivery, itemDescription, emailSubject, emailDate, trackingUrl) => {
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
    
    if (existing) {
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
    const { data, error } = await supabase
      .from('packages')
      .update({ status, updated_at: new Date().toISOString() })
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
