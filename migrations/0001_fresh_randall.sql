CREATE TYPE "public"."agenda_category" AS ENUM('meeting', 'review', 'task', 'deadline', 'break', 'personal');--> statement-breakpoint
CREATE TYPE "public"."agenda_item_type" AS ENUM('meeting', 'event', 'general_members_assembly');--> statement-breakpoint
CREATE TYPE "public"."agenda_vote_value" AS ENUM('for', 'against', 'abstain');--> statement-breakpoint
CREATE TYPE "public"."order_department" AS ENUM('1', '2', '3', '4', '5');--> statement-breakpoint
CREATE TYPE "public"."order_request_status" AS ENUM('accepted', 'declined', 'pending');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('Hardware', 'Electronic', 'Software', 'Social');--> statement-breakpoint
CREATE TYPE "public"."order_urgency" AS ENUM('1 day', '2 days', '3 days', '7 days');--> statement-breakpoint
CREATE TABLE "agenda_discussion_point" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"topic" text NOT NULL,
	"notes" text,
	"vote_prompt" text,
	"voting_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_discussion_point_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"discussion_point_id" text NOT NULL,
	"event_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"value" "agenda_vote_value" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agenda_event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"start" text NOT NULL,
	"end" text NOT NULL,
	"title" text NOT NULL,
	"item_type" "agenda_item_type" DEFAULT 'event' NOT NULL,
	"is_deadline" boolean DEFAULT false NOT NULL,
	"allow_voting" boolean DEFAULT false NOT NULL,
	"category" "agenda_category" DEFAULT 'meeting' NOT NULL,
	"description" text NOT NULL,
	"location" text,
	"attendees" text,
	"is_meeting" boolean DEFAULT true NOT NULL,
	"minutes" text,
	"minutes_summary" text,
	"minutes_decisions" text,
	"minutes_actions" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_request" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"department" "order_department" NOT NULL,
	"order_name" text DEFAULT 'Untitled order' NOT NULL,
	"description" text NOT NULL,
	"price_per_piece" numeric NOT NULL,
	"amount" integer NOT NULL,
	"type_of_order" "order_type" NOT NULL,
	"urgency" "order_urgency" NOT NULL,
	"comments" varchar(200) NOT NULL,
	"additional_costs" numeric NOT NULL,
	"total_costs" numeric NOT NULL,
	"ordered_date" timestamp NOT NULL,
	"photo_added" boolean DEFAULT false NOT NULL,
	"delivered" boolean DEFAULT false NOT NULL,
	"ordered" boolean DEFAULT false NOT NULL,
	"finalized" boolean DEFAULT false NOT NULL,
	"status" "order_request_status" DEFAULT 'pending' NOT NULL,
	"photo_needed" boolean DEFAULT false NOT NULL,
	"photo_uploaded" boolean DEFAULT false NOT NULL,
	"canceled" boolean DEFAULT false NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "budget" numeric(12, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "paid" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profile" ADD COLUMN "finalisation_time" timestamp;--> statement-breakpoint
ALTER TABLE "agenda_discussion_point" ADD CONSTRAINT "agenda_discussion_point_event_id_agenda_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."agenda_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_discussion_point_vote" ADD CONSTRAINT "agenda_discussion_point_vote_discussion_point_id_agenda_discussion_point_id_fk" FOREIGN KEY ("discussion_point_id") REFERENCES "public"."agenda_discussion_point"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_discussion_point_vote" ADD CONSTRAINT "agenda_discussion_point_vote_event_id_agenda_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."agenda_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_discussion_point_vote" ADD CONSTRAINT "agenda_discussion_point_vote_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_discussion_point_vote" ADD CONSTRAINT "agenda_discussion_point_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_event" ADD CONSTRAINT "agenda_event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agenda_event" ADD CONSTRAINT "agenda_event_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_request" ADD CONSTRAINT "order_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_request" ADD CONSTRAINT "order_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;