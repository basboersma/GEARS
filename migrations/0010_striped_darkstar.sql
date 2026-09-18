CREATE TABLE "team_history" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"snapshot_at" timestamp NOT NULL,
	"department_id" text NOT NULL,
	"member_id" text NOT NULL,
	"is_sub_lead" boolean DEFAULT false NOT NULL,
	"is_advisor" boolean DEFAULT false NOT NULL,
	"is_treasurer" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_department_id_organization_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."organization_department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_history" ADD CONSTRAINT "team_history_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;