CREATE TABLE "bank_details" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"details" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
