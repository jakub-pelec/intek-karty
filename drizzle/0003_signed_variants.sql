ALTER TABLE "cards" ADD COLUMN "signed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "cards_number_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "cards_number_signed_idx" ON "cards" USING btree ("number","signed");--> statement-breakpoint
ALTER TABLE "booster_drop_rates" ADD COLUMN "signed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DROP INDEX IF EXISTS "booster_drop_rates_type_rarity_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "booster_drop_rates_type_rarity_signed_idx" ON "booster_drop_rates" USING btree ("booster_type_id","rarity","signed");--> statement-breakpoint
ALTER TABLE "booster_types" DROP COLUMN "signature_chance_bp";
