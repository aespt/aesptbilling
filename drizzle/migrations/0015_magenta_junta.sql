ALTER TABLE "invoices" ALTER COLUMN "ship_to" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ALTER COLUMN "ship_from" DROP NOT NULL;