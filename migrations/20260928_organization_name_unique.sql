CREATE UNIQUE INDEX IF NOT EXISTS "organization_name_lower_unique"
ON "organization" (lower("name"));