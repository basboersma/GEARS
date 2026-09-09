CREATE TABLE "dashboard_file" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"parent_id" text,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"file_type" text,
	"size" text,
	"url" text,
	"modified_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_notification" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_roadmap_item" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"department" text NOT NULL,
	"start_date" text NOT NULL,
	"end_date" text NOT NULL,
	"color" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_todo" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"text" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"color" text DEFAULT '#4f6ef7' NOT NULL,
	"assigned_member_ids" text DEFAULT '[]' NOT NULL,
	"linked_file_ids" text DEFAULT '[]' NOT NULL,
	"add_to_calendar" boolean DEFAULT false NOT NULL,
	"calendar_date" text DEFAULT '' NOT NULL,
	"due_date" text,
	"subtasks" text DEFAULT '[]' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dashboard_file" ADD CONSTRAINT "dashboard_file_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_notification" ADD CONSTRAINT "dashboard_notification_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_roadmap_item" ADD CONSTRAINT "dashboard_roadmap_item_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dashboard_todo" ADD CONSTRAINT "dashboard_todo_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;