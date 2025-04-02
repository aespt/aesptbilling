ALTER TABLE "invoices" DROP COLUMN IF EXISTS "salesperson_name";--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "salesman_id" integer;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_salesman_id_salesmen_id_fk" FOREIGN KEY ("salesman_id") REFERENCES "public"."salesmen"("id") ON DELETE no action ON UPDATE no action;