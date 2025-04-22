DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'user_id') THEN
        ALTER TABLE "invoices" DROP COLUMN "user_id";
    END IF;
END $$; 