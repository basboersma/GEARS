ALTER TABLE "passwords" ADD COLUMN "password" text NOT NULL;--> statement-breakpoint
ALTER TABLE "passwords" DROP COLUMN "hash";--> statement-breakpoint
ALTER TABLE "passwords" DROP COLUMN "salt";