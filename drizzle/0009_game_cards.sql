ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "base_points" integer DEFAULT 0 NOT NULL;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "tags" text[] DEFAULT ARRAY[]::text[] NOT NULL;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "effect_kind" text;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "effect_tag" text;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "effect_value" integer;
ALTER TABLE "cards" ADD COLUMN IF NOT EXISTS "effect_threshold" integer;

CREATE TABLE IF NOT EXISTS "decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "decks_user_id_idx" ON "decks" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "decks_one_active_per_user" ON "decks" USING btree ("user_id") WHERE "is_active" = true;

CREATE TABLE IF NOT EXISTS "deck_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"slot" integer NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "deck_cards" ADD CONSTRAINT "deck_cards_slot_range" CHECK ("slot" >= 1 AND "slot" <= 6);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "deck_cards_deck_slot_idx" ON "deck_cards" USING btree ("deck_id","slot");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "deck_cards_deck_card_idx" ON "deck_cards" USING btree ("deck_id","card_id");
