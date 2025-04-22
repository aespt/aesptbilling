-- Drop existing foreign key constraints
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_created_by_users_id_fk') THEN
        ALTER TABLE "users" DROP CONSTRAINT "users_created_by_users_id_fk";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_updated_by_users_id_fk') THEN
        ALTER TABLE "users" DROP CONSTRAINT "users_updated_by_users_id_fk";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_created_by_users_id_fk') THEN
        ALTER TABLE "invoices" DROP CONSTRAINT "invoices_created_by_users_id_fk";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoices_updated_by_users_id_fk') THEN
        ALTER TABLE "invoices" DROP CONSTRAINT "invoices_updated_by_users_id_fk";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_items_created_by_users_id_fk') THEN
        ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_created_by_users_id_fk";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'invoice_items_updated_by_users_id_fk') THEN
        ALTER TABLE "invoice_items" DROP CONSTRAINT "invoice_items_updated_by_users_id_fk";
    END IF;
END $$;

-- Create temporary integer columns
ALTER TABLE "users" ADD COLUMN "created_by_new" integer;
ALTER TABLE "users" ADD COLUMN "updated_by_new" integer;
ALTER TABLE "invoices" ADD COLUMN "created_by_new" integer;
ALTER TABLE "invoices" ADD COLUMN "updated_by_new" integer;
ALTER TABLE "invoice_items" ADD COLUMN "created_by_new" integer;
ALTER TABLE "invoice_items" ADD COLUMN "updated_by_new" integer;

-- Update the new columns with converted values
UPDATE "users" 
SET "created_by_new" = CASE 
    WHEN "created_by" = 'system' THEN 1
    WHEN "created_by" IS NULL OR "created_by" = '' THEN NULL 
    ELSE "created_by"::integer 
END,
"updated_by_new" = CASE 
    WHEN "updated_by" = 'system' THEN 1
    WHEN "updated_by" IS NULL OR "updated_by" = '' THEN NULL 
    ELSE "updated_by"::integer 
END;

UPDATE "invoices" 
SET "created_by_new" = CASE 
    WHEN "created_by" = 'system' THEN 1
    WHEN "created_by" IS NULL OR "created_by" = '' THEN NULL 
    ELSE "created_by"::integer 
END,
"updated_by_new" = CASE 
    WHEN "updated_by" = 'system' THEN 1
    WHEN "updated_by" IS NULL OR "updated_by" = '' THEN NULL 
    ELSE "updated_by"::integer 
END;

UPDATE "invoice_items" 
SET "created_by_new" = CASE 
    WHEN "created_by" = 'system' THEN 1
    WHEN "created_by" IS NULL OR "created_by" = '' THEN NULL 
    ELSE "created_by"::integer 
END,
"updated_by_new" = CASE 
    WHEN "updated_by" = 'system' THEN 1
    WHEN "updated_by" IS NULL OR "updated_by" = '' THEN NULL 
    ELSE "updated_by"::integer 
END;

-- Drop old columns and rename new ones
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'created_by') THEN
        ALTER TABLE "users" DROP COLUMN "created_by";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'updated_by') THEN
        ALTER TABLE "users" DROP COLUMN "updated_by";
    END IF;
END $$;

ALTER TABLE "users" RENAME COLUMN "created_by_new" TO "created_by";
ALTER TABLE "users" RENAME COLUMN "updated_by_new" TO "updated_by";

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'created_by') THEN
        ALTER TABLE "invoices" DROP COLUMN "created_by";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'updated_by') THEN
        ALTER TABLE "invoices" DROP COLUMN "updated_by";
    END IF;
END $$;

ALTER TABLE "invoices" RENAME COLUMN "created_by_new" TO "created_by";
ALTER TABLE "invoices" RENAME COLUMN "updated_by_new" TO "updated_by";

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'created_by') THEN
        ALTER TABLE "invoice_items" DROP COLUMN "created_by";
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoice_items' AND column_name = 'updated_by') THEN
        ALTER TABLE "invoice_items" DROP COLUMN "updated_by";
    END IF;
END $$;

ALTER TABLE "invoice_items" RENAME COLUMN "created_by_new" TO "created_by";
ALTER TABLE "invoice_items" RENAME COLUMN "updated_by_new" TO "updated_by";

-- Add back foreign key constraints
ALTER TABLE "users" ADD CONSTRAINT "users_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "users" ADD CONSTRAINT "users_updated_by_users_id_fk" 
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_updated_by_users_id_fk" 
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_created_by_users_id_fk" 
    FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_updated_by_users_id_fk" 
    FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action; 