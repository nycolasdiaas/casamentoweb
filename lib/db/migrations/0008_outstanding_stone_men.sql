-- Fase 0 — fundação multi-tenant + métricas de acesso.
--
-- ESTA MIGRAÇÃO É ESTRITAMENTE ADITIVA E IDEMPOTENTE.
-- Nenhum DROP, DELETE, UPDATE ou alteração de coluna existente.
-- Ver docs/sdd-geracao-automatica.md §13.1.
--
-- Os guards (IF NOT EXISTS / EXCEPTION duplicate_object) existem porque
-- quatro tabelas (groups_backup, guests_backup, email_verification_tokens,
-- order_photos) JÁ EXISTEM em produção — vieram de um `drizzle-kit push`
-- antigo e nunca entraram no schema.ts. Aqui elas só passam a ser
-- rastreadas pelo Drizzle; no banco atual estes statements são no-op.
-- Em banco novo, criam tudo normalmente.

DO $$ BEGIN
 CREATE TYPE "public"."site_status" AS ENUM('provisioning', 'preview', 'published', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_verification_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "groups_backup" (
	"backup_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid NOT NULL,
	"slug" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guests_backup" (
	"backup_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	"rsvp_status" text NOT NULL,
	"responded_at" timestamp with time zone,
	"position" smallint NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "order_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "order_photos_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "sites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid,
	"user_id" uuid,
	"slug" text NOT NULL,
	"template_id" text,
	"theme" jsonb,
	"tier" "package_tier" NOT NULL,
	"status" "site_status" DEFAULT 'provisioning' NOT NULL,
	"preview_token" text NOT NULL,
	"published_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sites_order_id_unique" UNIQUE("order_id"),
	CONSTRAINT "sites_slug_unique" UNIQUE("slug"),
	CONSTRAINT "sites_preview_token_unique" UNIQUE("preview_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_content" (
	"site_id" uuid PRIMARY KEY NOT NULL,
	"couple_names" text,
	"partner_a" text,
	"partner_b" text,
	"wedding_date" timestamp with time zone,
	"timezone" text DEFAULT 'America/Fortaleza' NOT NULL,
	"ceremony_venue" text,
	"ceremony_address" text,
	"ceremony_map_url" text,
	"reception_venue" text,
	"reception_address" text,
	"story" text,
	"dress_code" text,
	"gift_message" text,
	"rsvp_deadline" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_sections" (
	"site_id" uuid NOT NULL,
	"section_key" text NOT NULL,
	"position" smallint DEFAULT 0 NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"config" jsonb,
	CONSTRAINT "site_sections_site_id_section_key_pk" PRIMARY KEY("site_id","section_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"site_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"path" text,
	"section" text,
	"referrer_host" text,
	"device" text,
	"country" text,
	"region" text,
	"visitor_hash" text,
	"is_returning" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "site_daily_stats" (
	"site_id" uuid NOT NULL,
	"day" date NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"unique_visitors" integer DEFAULT 0 NOT NULL,
	"rsvp_opens" integer DEFAULT 0 NOT NULL,
	"rsvp_submits" integer DEFAULT 0 NOT NULL,
	"gift_opens" integer DEFAULT 0 NOT NULL,
	"pix_copies" integer DEFAULT 0 NOT NULL,
	"gift_confirms" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "site_daily_stats_site_id_day_pk" PRIMARY KEY("site_id","day")
);
--> statement-breakpoint

-- Colunas de tenant nas tabelas existentes. NULLABLE de propósito: o
-- backfill preenche depois, e o NOT NULL só entra numa migração posterior,
-- após verificação em produção.
ALTER TABLE "gifts" ADD COLUMN IF NOT EXISTS "site_id" uuid;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "site_id" uuid;--> statement-breakpoint

DO $$ BEGIN
 ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "order_photos" ADD CONSTRAINT "order_photos_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "site_content" ADD CONSTRAINT "site_content_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "site_daily_stats" ADD CONSTRAINT "site_daily_stats_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "site_events" ADD CONSTRAINT "site_events_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "site_sections" ADD CONSTRAINT "site_sections_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sites" ADD CONSTRAINT "sites_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "sites" ADD CONSTRAINT "sites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- on delete restrict: apagar um site NUNCA pode cascatear para dentro de
-- dados de convidado real.
DO $$ BEGIN
 ALTER TABLE "gifts" ADD CONSTRAINT "gifts_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "groups" ADD CONSTRAINT "groups_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_email_verification_user_id" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_groups_backup_at" ON "groups_backup" USING btree ("backup_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_guests_backup_at" ON "guests_backup" USING btree ("backup_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_order_photos_order_id" ON "order_photos" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_site_events_site_created" ON "site_events" USING btree ("site_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_site_events_kind" ON "site_events" USING btree ("site_id","kind","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gifts_site_id" ON "gifts" USING btree ("site_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_groups_site_id" ON "groups" USING btree ("site_id");
