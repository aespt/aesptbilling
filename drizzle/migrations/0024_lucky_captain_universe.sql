DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
        CREATE TYPE "public"."invoice_type" AS ENUM('TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION');
    END IF;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_tags" (
	"id" serial PRIMARY KEY NOT NULL,
	"invoice_id" integer NOT NULL,
	"tag_name" varchar(50) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_tags" ADD CONSTRAINT "invoice_tags_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_type') THEN
        ALTER TABLE "invoices" ADD COLUMN "invoice_type" "invoice_type" DEFAULT 'TAX';
    END IF;
END $$;
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