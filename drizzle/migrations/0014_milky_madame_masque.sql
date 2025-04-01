ALTER TABLE "invoices" ADD COLUMN "ship_to" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "ship_from" varchar(255) NOT NULL;