-- Create packages table
CREATE TABLE IF NOT EXISTS packages (
  id BIGSERIAL PRIMARY KEY,
  tracking_number TEXT UNIQUE NOT NULL,
  carrier TEXT NOT NULL,
  status TEXT DEFAULT 'In Transit',
  estimated_delivery DATE,
  delivered_at TIMESTAMPTZ,
  item_description TEXT,
  email_subject TEXT,
  email_date TEXT,
  email_account TEXT,
  tracking_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to existing table (run these if table already exists)
ALTER TABLE packages ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS email_account TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_packages_tracking_number ON packages(tracking_number);
CREATE INDEX IF NOT EXISTS idx_packages_carrier ON packages(carrier);
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_packages_estimated_delivery ON packages(estimated_delivery);

-- Enable Row Level Security (RLS)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust as needed for multi-user)
CREATE POLICY "Allow all operations for authenticated users" 
  ON packages 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Create policy for anonymous access (public read)
CREATE POLICY "Allow public read access" 
  ON packages 
  FOR SELECT 
  USING (true);

-- Create policy for service role (full access)
CREATE POLICY "Service role has full access" 
  ON packages 
  FOR ALL 
  TO service_role
  USING (true) 
  WITH CHECK (true);
