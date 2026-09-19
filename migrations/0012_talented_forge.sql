ALTER TABLE "passwords" RENAME COLUMN "organization_id" TO "password";--> statement-breakpoint
ALTER TABLE "passwords" DROP CONSTRAINT "passwords_organization_id_unique";--> statement-breakpoint
ALTER TABLE "passwords" DROP CONSTRAINT "passwords_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "passwords" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passwords" DROP COLUMN "owner_hash";--> statement-breakpoint
ALTER TABLE "passwords" DROP COLUMN "owner_salt";--> statement-breakpoint
ALTER TABLE "passwords" DROP COLUMN "admin_hash";--> statement-breakpoint
ALTER TABLE "passwords" DROP COLUMN "admin_salt";--> statement-breakpoint
ALTER TABLE "passwords" ADD CONSTRAINT "passwords_user_id_unique" UNIQUE("user_id");