CREATE TABLE "team" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"department_id" text NOT NULL,
	"member_id" text NOT NULL,
	"is_sub_lead" boolean DEFAULT false NOT NULL,
	"is_advisor" boolean DEFAULT false NOT NULL,
	"is_treasurer" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "team_department_member_unique" UNIQUE("department_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_department_id_organization_department_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."organization_department"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;