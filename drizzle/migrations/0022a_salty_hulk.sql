DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
        CREATE TYPE "public"."invoice_type" AS ENUM('TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION');
    END IF;
END $$;
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "payment_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"payment_date" timestamp DEFAULT now(),
	"payment_method" varchar(100),
	"reference_number" varchar(100),
	"amount" decimal(10, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_type') THEN
        ALTER TABLE "invoices" ADD COLUMN "invoice_type" "invoice_type" DEFAULT 'TAX';
    END IF;
END $$;