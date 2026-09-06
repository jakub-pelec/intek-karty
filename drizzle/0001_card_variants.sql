ALTER TABLE "booster_types" ADD COLUMN "holographic_chance_bp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "booster_types" ADD COLUMN "signature_chance_bp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "draws" ADD COLUMN "holographic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "draws" ADD COLUMN "signature" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_cards" ADD COLUMN "holographic" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_cards" ADD COLUMN "signature" boolean DEFAULT false NOT NULL;