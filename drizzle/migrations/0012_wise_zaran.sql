CREATE TABLE "addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"street" varchar(255) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100),
	"country" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_by" varchar(100),
	"updated_by" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
