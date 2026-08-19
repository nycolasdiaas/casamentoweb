ALTER TABLE "site_invites" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "site_invites" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "site_invites" ADD CONSTRAINT "site_invites_slug_unique" UNIQUE("slug");