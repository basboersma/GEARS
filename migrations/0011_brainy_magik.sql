ALTER TABLE "team_history" DROP CONSTRAINT "team_history_member_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "team_history" ALTER COLUMN "department_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "team_history" ADD COLUMN "removed" boolean DEFAULT false NOT NULL;