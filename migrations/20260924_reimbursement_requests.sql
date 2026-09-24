CREATE TABLE IF NOT EXISTS "reimbursement_request" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "department" text NOT NULL DEFAULT '',
  "submitted_by" text NOT NULL,
  "link" text NOT NULL DEFAULT '',
  "price_per_piece" numeric NOT NULL,
  "quantity" integer NOT NULL,
  "order_type" text NOT NULL,
  "urgency" text NOT NULL,
  "comments" varchar(200) NOT NULL DEFAULT '',
  "status" text NOT NULL DEFAULT 'pending',
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);