ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "budget" numeric(12, 2) DEFAULT '0' NOT NULL;

ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "admin_page" boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS "organization_department" (
  "id" text PRIMARY KEY,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "organization_department_organization_id_idx"
ON "organization_department" ("organization_id");
