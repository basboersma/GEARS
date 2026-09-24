CREATE TABLE "reimbursement_request" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"department" text DEFAULT '' NOT NULL,
	"submitted_by" text NOT NULL,
	"link" text DEFAULT '' NOT NULL,
	"price_per_piece" numeric NOT NULL,
	"quantity" integer NOT NULL,
	"order_type" text NOT NULL,
	"urgency" text NOT NULL,
	"comments" varchar(200) DEFAULT '' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_request" ADD COLUMN "state" text DEFAULT 'Functional' NOT NULL;--> statement-breakpoint
ALTER TABLE "reimbursement_request" ADD CONSTRAINT "reimbursement_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reimbursement_request" ADD CONSTRAINT "reimbursement_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;