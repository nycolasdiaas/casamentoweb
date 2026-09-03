CREATE TABLE "gift_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gift_id" uuid NOT NULL,
	"storage_path" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"width" integer,
	"height" integer,
	"blur_data_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gift_photos_gift_id_unique" UNIQUE("gift_id"),
	CONSTRAINT "gift_photos_storage_path_unique" UNIQUE("storage_path")
);
--> statement-breakpoint
ALTER TABLE "gifts" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "gift_photos" ADD CONSTRAINT "gift_photos_gift_id_gifts_id_fk" FOREIGN KEY ("gift_id") REFERENCES "public"."gifts"("id") ON DELETE cascade ON UPDATE no action;