ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_campaign text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_content text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_term text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS attributed_revenue numeric DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS attributed_at timestamptz;
