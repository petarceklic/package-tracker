-- Create packages table
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
