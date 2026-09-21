CREATE TYPE "public"."order_acceptance_status" AS ENUM('neutral', 'accepted', 'denied');--> statement-breakpoint
ALTER TABLE "order_request" RENAME COLUMN "accepted" TO "accepted_legacy";--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "accepted" "public"."order_acceptance_status" DEFAULT 'neutral' NOT NULL;--> statement-breakpoint
UPDATE "order_request" SET "accepted" = CASE WHEN "accepted_legacy" THEN 'accepted'::"public"."order_acceptance_status" ELSE 'neutral'::"public"."order_acceptance_status" END;--> statement-breakpoint
ALTER TABLE "order_request" DROP COLUMN "accepted_legacy";