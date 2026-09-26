CREATE TABLE "board_permission_request" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"requested_by_user_id" text NOT NULL,
	"action" text NOT NULL,
	"target" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "board_permission_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"request_id" text NOT NULL,
	"member_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	CONSTRAINT "board_permission_vote_request_id_member_id_unique" UNIQUE("request_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "dashboard_notification" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "board_permission_request" ADD CONSTRAINT "board_permission_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_permission_request" ADD CONSTRAINT "board_permission_request_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_permission_vote" ADD CONSTRAINT "board_permission_vote_request_id_board_permission_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."board_permission_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board_permission_vote" ADD CONSTRAINT "board_permission_vote_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;