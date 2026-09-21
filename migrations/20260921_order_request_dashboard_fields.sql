ALTER TYPE "public"."order_request_status" ADD VALUE IF NOT EXISTS 'draft';

ALTER TABLE "order_request"
  ADD COLUMN IF NOT EXISTS "submitted_by" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "approved_by" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "link" text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "recurring" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "recurring_quantity" integer,
  ADD COLUMN IF NOT EXISTS "recurring_unit" text,
  ADD COLUMN IF NOT EXISTS "recurring_end_at" timestamp;