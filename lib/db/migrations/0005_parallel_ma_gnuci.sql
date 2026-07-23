ALTER TYPE "public"."order_status" ADD VALUE 'in_production';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'preview_ready';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'paid';--> statement-breakpoint
ALTER TYPE "public"."order_status" ADD VALUE 'published';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "preview_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "site_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "price_cents" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "admin_message" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_url" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text;