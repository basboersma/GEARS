CREATE TABLE "organization_department" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_request" ALTER COLUMN "department" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "admin_page" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_department" ADD CONSTRAINT "organization_department_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;