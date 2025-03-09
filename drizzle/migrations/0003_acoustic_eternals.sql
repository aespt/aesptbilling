CREATE TABLE "suppliers" (
	"id" serial PRIMARY KEY NOT NULL,
	"tax_registration_number" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"contact_number" varchar(20) NOT NULL,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salesmen" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"contact_number" varchar(20) NOT NULL,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "part_no" varchar(255);