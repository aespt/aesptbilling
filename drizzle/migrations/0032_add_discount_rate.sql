-- Add discount_rate column to purchases table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'discount_rate') THEN
        ALTER TABLE "invoices" ADD COLUMN "discount_rate" DECIMAL(5, 2) DEFAULT '0';
    END IF;
END $$; 