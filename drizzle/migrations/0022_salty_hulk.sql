CREATE TYPE "public"."invoice_type" AS ENUM('TAX', 'DELIVERY', 'PROFORMA', 'QUOTATION');--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_created_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_updated_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "invoice_type" "invoice_type" DEFAULT 'TAX';