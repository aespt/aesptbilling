ALTER TABLE "gst_master" RENAME COLUMN "gst_percentage" TO "cgst_percentage";--> statement-breakpoint
ALTER TABLE "gst_master" ALTER COLUMN "effective_from" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "vat_master" ALTER COLUMN "effective_from" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "gst_master" ADD COLUMN "sgst_percentage" numeric(5, 2) NOT NULL;--> statement-breakpoint