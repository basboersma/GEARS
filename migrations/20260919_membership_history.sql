ALTER TABLE "team_history"
  ADD COLUMN IF NOT EXISTS "removed" boolean NOT NULL DEFAULT false;

ALTER TABLE "team_history"
  ALTER COLUMN "department_id" DROP NOT NULL;

ALTER TABLE "team_history"
  DROP CONSTRAINT IF EXISTS "team_history_member_id_member_id_fk";

INSERT INTO "team_history" (
  "id",
  "organization_id",
  "snapshot_at",
  "department_id",
  "member_id",
  "is_sub_lead",
  "is_advisor",
  "is_treasurer",
  "removed"
)
SELECT
  'membership:' || "member"."id" || ':joined',
  "member"."organization_id",
  "member"."created_at",
  NULL,
  "member"."id",
  false,
  false,
  false,
  false
FROM "member"
ON CONFLICT ("id") DO NOTHING;