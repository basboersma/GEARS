ALTER TABLE "reimbursement_request"
ADD COLUMN IF NOT EXISTS "order_name" text NOT NULL DEFAULT '';

UPDATE "reimbursement_request"
SET "order_name" = "name"
WHERE "order_name" = '';