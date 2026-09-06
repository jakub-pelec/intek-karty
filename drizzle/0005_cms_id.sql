ALTER TABLE "collections" ADD COLUMN "cms_id" text;--> statement-breakpoint
ALTER TABLE "cards" ADD COLUMN "cms_id" text;--> statement-breakpoint
ALTER TABLE "booster_types" ADD COLUMN "cms_id" text;--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN "cms_id" text;--> statement-breakpoint
ALTER TABLE "rewards" ADD COLUMN "cms_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_cms_id_idx" ON "collections" USING btree ("cms_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cards_cms_id_idx" ON "cards" USING btree ("cms_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booster_types_cms_id_idx" ON "booster_types" USING btree ("cms_id");--> statement-breakpoint
CREATE UNIQUE INDEX "achievements_cms_id_idx" ON "achievements" USING btree ("cms_id");--> statement-breakpoint
CREATE UNIQUE INDEX "rewards_cms_id_idx" ON "rewards" USING btree ("cms_id");
