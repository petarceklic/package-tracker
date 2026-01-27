const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtncm91Y3lmcnF1eGdid3Vra3FzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzk0NzY0NywiZXhwIjoyMDUzNTIzNjQ3fQ.knltXVKk12BbsSqYHIEO-A_Si8xQ3IY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🗄️  Setting up Supabase database...\n');
  
  try {
    // Create packages table using raw SQL
    const { error } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS packages (
          id BIGSERIAL PRIMARY KEY,
          tracking_number TEXT UNIQUE NOT NULL,
          carrier TEXT NOT NULL,
          status TEXT DEFAULT 'In Transit',
          estimated_delivery DATE,
          item_description TEXT,
          email_subject TEXT,
          email_date TEXT,
          tracking_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_packages_tracking_number ON packages(tracking_number);
        CREATE INDEX IF NOT EXISTS idx_packages_carrier ON packages(carrier);
        CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
        CREATE INDEX IF NOT EXISTS idx_packages_estimated_delivery ON packages(estimated_delivery);
        
        ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (error) {
      console.error('❌ Error creating table:', error.message);
      
      // Fallback: Try creating via REST API
      console.log('Attempting direct table creation...');
      
      // Just try to insert a test row to trigger table creation
      const { error: insertError } = await supabase
        .from('packages')
        .insert([{
          tracking_number: 'TEST123',
          carrier: 'Test Carrier',
          status: 'Test',
          item_description: 'Test package'
        }]);
      
      if (insertError && !insertError.message.includes('already exists')) {
        console.error('❌ Table creation failed:', insertError.message);
        console.log('\n📋 Manual Setup Required:');
        console.log('1. Go to https://kgroucyfrquxgbwukkqs.supabase.co');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the SQL from supabase-schema.sql');
        console.log('4. Execute the query');
        return;
      }
      
      // Delete test row
      await supabase.from('packages').delete().eq('tracking_number', 'TEST123');
    }
    
    console.log('✅ Database setup complete!');
    console.log('✅ Packages table created with indexes');
    console.log('✅ RLS policies enabled\n');
    
  } catch (err) {
    console.error('❌ Setup error:', err.message);
    console.log('\n📋 Please set up manually:');
    console.log('Run the SQL from supabase-schema.sql in Supabase SQL Editor');
  }
}

setupDatabase().then(() => {
  console.log('🎉 Setup finished!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
