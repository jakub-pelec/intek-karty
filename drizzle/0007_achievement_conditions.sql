ALTER TYPE "achievement_condition" ADD VALUE IF NOT EXISTS 'holo_collected_threshold';
--> statement-breakpoint
ALTER TYPE "achievement_condition" ADD VALUE IF NOT EXISTS 'signed_collected_threshold';
--> statement-breakpoint
ALTER TYPE "achievement_condition" ADD VALUE IF NOT EXISTS 'signed_holo_collected_threshold';
--> statement-breakpoint
ALTER TYPE "achievement_condition" ADD VALUE IF NOT EXISTS 'signed_holo_legendary_threshold';
--> statement-breakpoint
ALTER TYPE "achievement_condition" ADD VALUE IF NOT EXISTS 'collection_first_card';
--> statement-breakpoint
ALTER TYPE "achievement_condition" ADD VALUE IF NOT EXISTS 'collection_complete';
--> statement-breakpoint
ALTER TYPE "achievement_condition" ADD VALUE IF NOT EXISTS 'collection_holo_complete';
--> statement-breakpoint
ALTER TABLE "achievements" ADD COLUMN IF NOT EXISTS "collection_slug" text;
