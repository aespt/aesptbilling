DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'salesperson_name') THEN
        ALTER TABLE "invoices" DROP COLUMN "salesperson_name";
    END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "salesman_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salesman_id_salesmen_id_fk" FOREIGN KEY ("salesman_id") REFERENCES "public"."salesmen"("id") ON DELETE no action ON UPDATE no action;