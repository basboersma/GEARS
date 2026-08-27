import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_request'
      AND column_name = 'price_per_piece'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "order_request"
    ALTER COLUMN "price_per_piece"
    TYPE numeric
    USING NULLIF("price_per_piece", '')::numeric;
  END IF;
END $$;`,
  `DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'order_request'
      AND column_name = 'amount'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "order_request"
    ALTER COLUMN "amount"
    TYPE integer
    USING NULLIF("amount", '')::integer;
  END IF;
END $$;`,
];

for (const statement of statements) {
  await sql.query(statement);
}

console.log("order_request column type conversion complete");
