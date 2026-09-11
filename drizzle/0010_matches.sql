ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "rating" integer DEFAULT 1000 NOT NULL;

DO $$ BEGIN
  CREATE TYPE "public"."match_kind" AS ENUM ('ranked', 'practice');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."match_status" AS ENUM ('revealing', 'finished');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."match_winner" AS ENUM ('a', 'b', 'draw');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "match_kind" NOT NULL,
	"status" "match_status" DEFAULT 'revealing' NOT NULL,
	"revealed_count" integer DEFAULT 0 NOT NULL,
	"player_a_id" uuid NOT NULL,
	"player_b_id" uuid,
	"player_a_name" text NOT NULL,
	"player_b_name" text NOT NULL,
	"player_a_rating" integer NOT NULL,
	"player_b_rating" integer NOT NULL,
	"player_a_lineup" jsonb NOT NULL,
	"player_b_lineup" jsonb NOT NULL,
	"winner_side" "match_winner",
	"rating_delta_a" integer,
	"rating_delta_b" integer,
	"finished_at" timestamptz,
	"created_at" timestamptz DEFAULT now() NOT NULL,
	"updated_at" timestamptz DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_a_id_users_id_fk" FOREIGN KEY ("player_a_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_b_id_users_id_fk" FOREIGN KEY ("player_b_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_revealed_count_range" CHECK ("revealed_count" >= 0 AND "revealed_count" <= 6);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_player_a_idx" ON "matches" USING btree ("player_a_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_player_b_idx" ON "matches" USING btree ("player_b_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "matches_status_idx" ON "matches" USING btree ("status");
