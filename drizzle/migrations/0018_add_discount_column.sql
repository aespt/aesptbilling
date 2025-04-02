-- Check if column exists first to avoid errors
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'invoices' 
        AND column_name = 'discount'
    ) THEN
        ALTER TABLE "invoices" ADD COLUMN "discount" numeric(10, 2) DEFAULT '0';
    END IF;
END $$; 