CREATE TYPE "public"."board_position" AS ENUM('Chair', 'Secretary', 'Extern', 'Treasurer', 'PR', 'Intern');--> statement-breakpoint
CREATE TYPE "public"."gma_motion_status" AS ENUM('suggested', 'pending', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."gma_vote_value" AS ENUM('for', 'against', 'abstain');--> statement-breakpoint
CREATE TABLE "board" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"member_id" text NOT NULL,
	"position" "board_position" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "board_organization_position_unique" UNIQUE("organization_id","position"),
	CONSTRAINT "board_organization_member_unique" UNIQUE("organization_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "gma_motion" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"status" "gma_motion_status" DEFAULT 'suggested' NOT NULL,
	"timer_seconds" integer DEFAULT 300 NOT NULL,
	"timer_started_at" timestamp,
	"timer_paused" boolean DEFAULT true NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gma_motion_vote" (
	"id" text PRIMARY KEY NOT NULL,
	"motion_id" text NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"value" "gma_vote_value" NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "gma_motion_vote_motion_id_user_id_unique" UNIQUE("motion_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "gma_presence" (
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	CONSTRAINT "gma_presence_session_id_user_id_unique" UNIQUE("session_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "gma_session" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"created_by_user_id" text NOT NULL,
	"start_date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board" ADD CONSTRAINT "board_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "board" ADD CONSTRAINT "board_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_motion" ADD CONSTRAINT "gma_motion_session_id_gma_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gma_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_motion" ADD CONSTRAINT "gma_motion_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_motion" ADD CONSTRAINT "gma_motion_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_motion_vote" ADD CONSTRAINT "gma_motion_vote_motion_id_gma_motion_id_fk" FOREIGN KEY ("motion_id") REFERENCES "public"."gma_motion"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_motion_vote" ADD CONSTRAINT "gma_motion_vote_session_id_gma_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gma_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_motion_vote" ADD CONSTRAINT "gma_motion_vote_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_presence" ADD CONSTRAINT "gma_presence_session_id_gma_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."gma_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_presence" ADD CONSTRAINT "gma_presence_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_session" ADD CONSTRAINT "gma_session_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gma_session" ADD CONSTRAINT "gma_session_created_by_user_id_user_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;