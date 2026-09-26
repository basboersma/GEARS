-- Keep one organization membership per user before enforcing the invariant.
WITH duplicate_members AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY organization_id, user_id
      ORDER BY created_at, id
    ) AS member_number
  FROM member
)
DELETE FROM member
WHERE id IN (
  SELECT id FROM duplicate_members WHERE member_number > 1
);

CREATE TABLE IF NOT EXISTS "board_history" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "snapshot_at" timestamp NOT NULL,
  "member_id" text NOT NULL,
  "position" "board_position" NOT NULL,
  "removed" boolean NOT NULL DEFAULT false
);

ALTER TABLE "member"
  ADD CONSTRAINT "member_organization_user_unique"
  UNIQUE ("organization_id", "user_id");