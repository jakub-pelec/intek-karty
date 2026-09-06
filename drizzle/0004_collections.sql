CREATE TABLE "collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX "collections_slug_idx" ON "collections" USING btree ("slug");--> statement-breakpoint
INSERT INTO "collections" ("id", "slug", "name", "description", "active", "sort_order")
VALUES (
	'0c1e7c01-0000-4000-8000-000000000001',
	'origin',
	'Origin',
	'The first binder.',
	true,
	0
);--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "collection_id" uuid;--> statement-breakpoint
ALTER TABLE "booster_types" ADD COLUMN "collection_id" uuid;--> statement-breakpoint
UPDATE "cards" SET "collection_id" = '0c1e7c01-0000-4000-8000-000000000001' WHERE "collection_id" IS NULL;--> statement-breakpoint
UPDATE "booster_types" SET "collection_id" = '0c1e7c01-0000-4000-8000-000000000001' WHERE "collection_id" IS NULL;--> statement-breakpoint
ALTER TABLE "cards" ALTER COLUMN "collection_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "booster_types" ALTER COLUMN "collection_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booster_types" ADD CONSTRAINT "booster_types_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
DROP INDEX IF EXISTS "cards_number_signed_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "cards_collection_number_signed_idx" ON "cards" USING btree ("collection_id","number","signed");
