CREATE TABLE IF NOT EXISTS "team" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "department_id" text NOT NULL REFERENCES "organization_department"("id") ON DELETE CASCADE,
  "member_id" text NOT NULL REFERENCES "member"("id") ON DELETE CASCADE,
  "is_sub_lead" boolean NOT NULL DEFAULT false,
  "is_advisor" boolean NOT NULL DEFAULT false,
  "is_treasurer" boolean NOT NULL DEFAULT false,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL,
  CONSTRAINT "team_department_member_unique" UNIQUE("department_id", "member_id")
);