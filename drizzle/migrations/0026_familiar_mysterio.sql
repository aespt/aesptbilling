CREATE TYPE "public"."invoice_stage" AS ENUM('SALE', 'PROFORMA', 'QUOTATION');--> statement-breakpoint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_created_by_users_id_fk') THEN
        ALTER TABLE "users" DROP CONSTRAINT "users_created_by_users_id_fk";
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_updated_by_users_id_fk') THEN
        ALTER TABLE "users" DROP CONSTRAINT "users_updated_by_users_id_fk";
    END IF;
END $$;
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_stage') THEN
        ALTER TABLE "invoices" ADD COLUMN "invoice_stage" "invoice_stage" DEFAULT 'SALE';
    END IF;
END $$;