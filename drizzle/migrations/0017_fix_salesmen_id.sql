-- First, add the new column
ALTER TABLE "invoices" ADD COLUMN "salesmen_id_new" integer;

-- Drop the foreign key constraint if it exists
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_salesperson_name_salesmen_id_fk";

-- Drop the old column
ALTER TABLE "invoices" DROP COLUMN "salesperson_name";

-- Rename the new column to the final name
ALTER TABLE "invoices" RENAME COLUMN "salesmen_id_new" TO "salesmen_id";

-- Add the foreign key constraint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salesmen_id_salesmen_id_fk" 
    FOREIGN KEY ("salesmen_id") REFERENCES "public"."salesmen"("id") 
    ON DELETE no action ON UPDATE no action; 