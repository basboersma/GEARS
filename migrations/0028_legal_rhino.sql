ALTER TABLE "dashboard_notification" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "reimbursement_request" ADD COLUMN "deny_comment" text;--> statement-breakpoint
ALTER TABLE "reimbursement_request" ADD COLUMN "payment_comment" text;--> statement-breakpoint
ALTER TABLE "dashboard_notification" ADD CONSTRAINT "dashboard_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "order_request"
SET "finalized" = false
WHERE "finalized" = true
	AND NOT (
		"status" = 'accepted'
		AND "accepted" = 'accepted'
		AND "invoice_added" = true
		AND ("photo_needed" = false OR "photo_uploaded" = true)
	);