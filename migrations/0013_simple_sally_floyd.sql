ALTER TABLE "passwords" ADD COLUMN "hash" text NOT NULL;--> statement-breakpoint
ALTER TABLE "passwords" ADD COLUMN "salt" text NOT NULL;--> statement-breakpoint
ALTER TABLE "passwords" DROP COLUMN "password";