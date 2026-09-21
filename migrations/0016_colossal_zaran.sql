ALTER TYPE "public"."order_request_status" ADD VALUE 'draft';--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "submitted_by" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "approved_by" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "link" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "recurring" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "recurring_quantity" integer;--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "recurring_unit" text;--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "recurring_end_at" timestamp;