CREATE TABLE IF NOT EXISTS "budget_setting" (
  "id" text PRIMARY KEY,
  "total_budget" numeric(12,2) NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "organization_budget" (
  "id" text PRIMARY KEY,
  "organization_id" text NOT NULL UNIQUE REFERENCES "organization"("id") ON DELETE CASCADE,
  "allocated_budget" numeric(12,2) NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);
