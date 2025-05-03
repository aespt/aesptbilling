CREATE TABLE "purchase_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchaseentry_number" varchar(50) NOT NULL,
	"purchaseentry_date" timestamp DEFAULT now() NOT NULL,
	"supplier_id" integer NOT NULL,
	"tax_type" "purchase_tax_type" DEFAULT 'NONE',
	"tax_rate" numeric(5, 2) DEFAULT '0',
	"discount_rate" numeric(5, 2) DEFAULT '0',
	"sub_total" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"purchase_type" "purchase_type" DEFAULT 'TAX',
	"total" numeric(10, 2) NOT NULL,
	"ship_from" varchar(255),
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "purchase_entries_purchaseentry_number_unique" UNIQUE("purchaseentry_number")
);
--> statement-breakpoint
CREATE TABLE "purchase_entry_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"purchase_entry_id" integer NOT NULL,
	"product_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "purchase_entries" ADD CONSTRAINT "purchase_entries_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_entries" ADD CONSTRAINT "purchase_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_entries" ADD CONSTRAINT "purchase_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_entry_items" ADD CONSTRAINT "purchase_entry_items_purchase_entry_id_purchase_entries_id_fk" FOREIGN KEY ("purchase_entry_id") REFERENCES "public"."purchase_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_entry_items" ADD CONSTRAINT "purchase_entry_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_entry_items" ADD CONSTRAINT "purchase_entry_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_entry_items" ADD CONSTRAINT "purchase_entry_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;