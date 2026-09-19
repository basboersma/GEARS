DROP TABLE IF EXISTS "passwords";

CREATE TABLE "passwords" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
  "password" text NOT NULL,
  "created_at" timestamp NOT NULL,
  "updated_at" timestamp NOT NULL
);