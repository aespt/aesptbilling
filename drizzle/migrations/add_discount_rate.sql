-- Add discount_rate column to purchases table
ALTER TABLE IF EXISTS purchases
ADD COLUMN IF NOT EXISTS discount_rate DECIMAL(5, 2) DEFAULT 0; 