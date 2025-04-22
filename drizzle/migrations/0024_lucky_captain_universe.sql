CREATE TYPE "public"."invoice_type" AS ENUM('TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION');--> statement-breakpoint
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
ALTER TABLE "products" ADD COLUMN "brand" varchar(255);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_type" "invoice_type" DEFAULT 'TAX';