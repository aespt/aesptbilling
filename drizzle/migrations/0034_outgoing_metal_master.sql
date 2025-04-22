ALTER TABLE "payment_details" ALTER COLUMN "payment_method" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "payment_details" ALTER COLUMN "payment_status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD COLUMN "mrp" numeric(10, 2) NOT NULL;