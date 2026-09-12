CREATE TYPE "public"."reimbursement_status" AS ENUM('not_requested', 'pending', 'successful', 'failed');--> statement-breakpoint
CREATE TABLE "dashboard_todo_assignee" (
	"todo_id" text NOT NULL,
	"member_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "reimbursement_status" "reimbursement_status" DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE "dashboard_todo_assignee" ADD CONSTRAINT "dashboard_todo_assignee_todo_id_dashboard_todo_id_fk" FOREIGN KEY ("todo_id") REFERENCES "public"."dashboard_todo"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_todo_assignee" ADD CONSTRAINT "dashboard_todo_assignee_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;