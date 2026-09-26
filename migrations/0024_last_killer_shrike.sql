CREATE TABLE "board_history" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"snapshot_at" timestamp NOT NULL,
	"member_id" text NOT NULL,
	"position" "board_position" NOT NULL,
	"removed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "board_history" ADD CONSTRAINT "board_history_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
WITH duplicate_members AS (
	SELECT "id",
		row_number() OVER (
			PARTITION BY "organization_id", "user_id"
			ORDER BY "created_at", "id"
		) AS member_number
	FROM "member"
)
DELETE FROM "member"
WHERE "id" IN (
	SELECT "id" FROM duplicate_members WHERE member_number > 1
);--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_user_unique" UNIQUE("organization_id","user_id");