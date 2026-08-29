import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "./schema";

config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL. Set it in the environment before starting the app."
  );
}

export const db = drizzle(databaseUrl, { schema });
