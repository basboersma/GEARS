CREATE TABLE IF NOT EXISTS "passwords" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL UNIQUE REFERENCES "organization"("id") ON DELETE CASCADE,
  "owner_hash" text,
  "owner_salt" text,
  "admin_hash" text,
  "admin_salt" text,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);