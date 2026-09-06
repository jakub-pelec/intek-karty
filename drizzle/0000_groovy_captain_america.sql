CREATE TYPE "public"."achievement_condition" AS ENUM('first_booster', 'first_epic', 'first_legendary', 'first_joker', 'cards_collected_threshold', 'full_collection');--> statement-breakpoint
CREATE TYPE "public"."booster_status" AS ENUM('pending', 'opened', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."ledger_source" AS ENUM('duplicate', 'achievement', 'shop_redeem', 'admin_adjust');--> statement-breakpoint
CREATE TYPE "public"."rarity" AS ENUM('common', 'rare', 'epic', 'legendary', 'joker');--> statement-breakpoint
CREATE TYPE "public"."redemption_status" AS ENUM('pending_fulfillment', 'fulfilled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('viewer', 'admin');--> statement-breakpoint
CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"condition_type" "achievement_condition" NOT NULL,
	"threshold" integer,
	"point_reward" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booster_drop_rates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booster_type_id" uuid NOT NULL,
	"rarity" "rarity" NOT NULL,
	"probability_bp" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "booster_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"twitch_channel_point_cost" integer NOT NULL,
	"twitch_reward_id" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"rarity" "rarity" NOT NULL,
	"image_url" text,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draws" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"booster_type_id" uuid,
	"user_booster_id" uuid,
	"note" text,
	"card_id" uuid NOT NULL,
	"is_duplicate" boolean DEFAULT false NOT NULL,
	"points_awarded" integer DEFAULT 0 NOT NULL,
	"triggered_by" uuid NOT NULL,
	"viewer_name" text DEFAULT '' NOT NULL,
	"card_name" text DEFAULT '' NOT NULL,
	"card_number" integer DEFAULT 0 NOT NULL,
	"card_rarity" "rarity" DEFAULT 'common' NOT NULL,
	"card_image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "points_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"source" "ledger_source" NOT NULL,
	"ref_id" uuid,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rewards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"point_cost" integer NOT NULL,
	"stock" integer,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shop_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"reward_id" uuid NOT NULL,
	"points_spent" integer NOT NULL,
	"status" "redemption_status" DEFAULT 'pending_fulfillment' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_boosters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"twitch_id" text NOT NULL,
	"user_id" uuid,
	"booster_type_id" uuid NOT NULL,
	"status" "booster_status" DEFAULT 'pending' NOT NULL,
	"twitch_redemption_id" text,
	"opened_by" uuid,
	"note" text,
	"opened_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"draw_id" uuid,
	"acquired_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"twitch_id" text NOT NULL,
	"name" text NOT NULL,
	"image" text,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"points_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booster_drop_rates" ADD CONSTRAINT "booster_drop_rates_booster_type_id_booster_types_id_fk" FOREIGN KEY ("booster_type_id") REFERENCES "public"."booster_types"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_booster_type_id_booster_types_id_fk" FOREIGN KEY ("booster_type_id") REFERENCES "public"."booster_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_user_booster_id_user_boosters_id_fk" FOREIGN KEY ("user_booster_id") REFERENCES "public"."user_boosters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "draws" ADD CONSTRAINT "draws_triggered_by_users_id_fk" FOREIGN KEY ("triggered_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_ledger" ADD CONSTRAINT "points_ledger_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_redemptions" ADD CONSTRAINT "shop_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_redemptions" ADD CONSTRAINT "shop_redemptions_reward_id_rewards_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."rewards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_boosters" ADD CONSTRAINT "user_boosters_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_boosters" ADD CONSTRAINT "user_boosters_booster_type_id_booster_types_id_fk" FOREIGN KEY ("booster_type_id") REFERENCES "public"."booster_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_boosters" ADD CONSTRAINT "user_boosters_opened_by_users_id_fk" FOREIGN KEY ("opened_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_cards" ADD CONSTRAINT "user_cards_draw_id_draws_id_fk" FOREIGN KEY ("draw_id") REFERENCES "public"."draws"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_slug_idx" ON "achievements" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "booster_drop_rates_type_rarity_idx" ON "booster_drop_rates" USING btree ("booster_type_id","rarity");--> statement-breakpoint
CREATE UNIQUE INDEX "booster_types_slug_idx" ON "booster_types" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "booster_types_twitch_reward_id_idx" ON "booster_types" USING btree ("twitch_reward_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cards_number_idx" ON "cards" USING btree ("number");--> statement-breakpoint
CREATE UNIQUE INDEX "draws_user_booster_idx" ON "draws" USING btree ("user_booster_id");--> statement-breakpoint
CREATE INDEX "draws_created_at_idx" ON "draws" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "draws_user_id_idx" ON "draws" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "points_ledger_user_idx" ON "points_ledger" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "shop_redemptions_created_at_idx" ON "shop_redemptions" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_user_ach_idx" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_boosters_redemption_idx" ON "user_boosters" USING btree ("twitch_redemption_id");--> statement-breakpoint
CREATE INDEX "user_boosters_status_idx" ON "user_boosters" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "user_boosters_twitch_id_idx" ON "user_boosters" USING btree ("twitch_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_cards_user_card_idx" ON "user_cards" USING btree ("user_id","card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_twitch_id_idx" ON "users" USING btree ("twitch_id");