CREATE TYPE "public"."site_access_mode" AS ENUM('public', 'password');--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "seats" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "seats_confirmed" smallint;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "attending_names" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "message" text;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "responded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "access_mode" "site_access_mode" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "access_password_hash" text;