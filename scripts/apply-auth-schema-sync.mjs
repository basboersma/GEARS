import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `DO $$
BEGIN
  CREATE TYPE "role" AS ENUM ('member', 'admin', 'owner');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;`,
  'ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "active_organization_id" text;',
  `CREATE TABLE IF NOT EXISTS "organization" (
  "id" text PRIMARY KEY,
  "name" text NOT NULL,
  "slug" text,
  "logo" text,
  "created_at" timestamp NOT NULL,
  "metadata" text
);`,
  'CREATE UNIQUE INDEX IF NOT EXISTS "organization_slug_unique" ON "organization" ("slug");',
  `CREATE TABLE IF NOT EXISTS "member" (
  "id" text PRIMARY KEY,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "role" "role" DEFAULT 'member' NOT NULL,
  "created_at" timestamp NOT NULL
);`,
  `CREATE TABLE IF NOT EXISTS "invitation" (
  "id" text PRIMARY KEY,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "role" text,
  "status" text DEFAULT 'pending' NOT NULL,
  "expires_at" timestamp NOT NULL,
  "inviter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);`,
];

for (const statement of statements) {
  await sql.query(statement);
}

console.log("Schema sync applied");
