ALTER TABLE "organization"
  ADD COLUMN IF NOT EXISTS "budget" numeric(12,2) NOT NULL DEFAULT 0;

DROP TABLE IF EXISTS "budget_setting";
DROP TABLE IF EXISTS "organization_budget";
