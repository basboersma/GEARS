ALTER TABLE "order_request"
  ADD COLUMN IF NOT EXISTS "invoice_added" boolean NOT NULL DEFAULT false;