-- Promote legacy team and board assignments into the authoritative member role.
UPDATE "member" AS m
SET "role" = CASE
  WHEN EXISTS (
    SELECT 1
    FROM "board" AS b
    WHERE b."member_id" = m."id"
  ) THEN 'board'::"role"
  WHEN EXISTS (
    SELECT 1
    FROM "team" AS t
    WHERE t."member_id" = m."id" AND t."is_treasurer" = true
  ) THEN 'treasurer'::"role"
  WHEN EXISTS (
    SELECT 1
    FROM "team" AS t
    WHERE t."member_id" = m."id" AND t."is_advisor" = true
  ) THEN 'advisor'::"role"
  WHEN EXISTS (
    SELECT 1
    FROM "team" AS t
    WHERE t."member_id" = m."id" AND t."is_sub_lead" = true
  ) THEN 'sublead'::"role"
  ELSE m."role"
END
WHERE m."role" IN ('member', 'sub_owner');
