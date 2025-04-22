-- Create type was moved to 0028_fix_migration.sql
-- CREATE TYPE "public"."invoice_stage" AS ENUM('SALE', 'PROFORMA', 'QUOTATION');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'CREDIT', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID');--> statement-breakpoint
CREATE TABLE "payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"payment_method" "payment_method" DEFAULT 'CASH',
	"payment_status" "payment_status" DEFAULT 'UNPAID',
	"payment_date" timestamp DEFAULT now(),
	"reference_number" varchar(100),
	"payment_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_stage') THEN
        ALTER TABLE "invoices" ADD COLUMN "invoice_stage" "invoice_stage" DEFAULT 'SALE';
    END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "payment_details" ADD CONSTRAINT "payment_details_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint

-- Drop invoice_type column if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_type') THEN
        ALTER TABLE "invoices" DROP COLUMN "invoice_type";
    END IF;
END $$;
--> statement-breakpoint

-- Drop invoice_type enum if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
        DROP TYPE "public"."invoice_type";
    END IF;
END $$;