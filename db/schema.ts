import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activeOrganizationId: text("active_organization_id"),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  logo: text("logo"),
  createdAt: timestamp("created_at").notNull(),
  metadata: text("metadata"),
});

export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
}));

export type Organization = typeof organization.$inferSelect;

export const role = pgEnum("role", ["member", "admin", "owner"]);

export const educationalInstitution = pgEnum("educational_institution", [
  "University of Groningen",
  "Hanze",
  "Guest",
]);

export const orderDepartment = pgEnum("order_department", [
  "1",
  "2",
  "3",
  "4",
  "5",
]);

export const orderType = pgEnum("order_type", [
  "Hardware",
  "Electronic",
  "Software",
  "Social",
]);

export const orderUrgency = pgEnum("order_urgency", [
  "1 day",
  "2 days",
  "3 days",
  "7 days",
]);

export type Role = (typeof role.enumValues)[number];

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: role("role").default("member").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const studentProfile = pgTable("student_profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  surname: text("surname").notNull(),
  studentNumber: text("student_number").notNull(),
  educationalInstitution: educationalInstitution(
    "educational_institution"
  ).notNull(),
  study: text("study").notNull(),
  ibanNumber: text("iban_number").notNull(),
  fieldsFilled: boolean("fields_filled")
    .$defaultFn(() => false)
    .notNull(),
  paid: boolean("paid")
    .$defaultFn(() => false)
    .notNull(),
  finalisationTime: timestamp("finalisation_time"),
  inormationProcessingConsent: boolean("inormation_processing_consent")
    .$defaultFn(() => false)
    .notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const memberRelations = relations(member, ({ one }) => ({
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
}));

export type Member = typeof member.$inferSelect & {
  user: typeof user.$inferSelect;
};

export type User = typeof user.$inferSelect;

export const invitation = pgTable("invitation", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role"),
  status: text("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const orderRequest = pgTable("order_request", {
  id: text("id").primaryKey(),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  department: orderDepartment("department").notNull(),
  pricePerPiece: numeric("price_per_piece").notNull(),
  amount: integer("amount").notNull(),
  typeOfOrder: orderType("type_of_order").notNull(),
  urgency: orderUrgency("urgency").notNull(),
  comments: varchar("comments", { length: 200 }).notNull(),
  additionalCosts: numeric("additional_costs").notNull(),
  totalCosts: numeric("total_costs").notNull(),
  orderedDate: timestamp("ordered_date").notNull(),
  photoAdded: boolean("photo_added").default(false).notNull(),
  delivered: boolean("delivered").default(false).notNull(),
  canceled: boolean("canceled").default(false).notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const schema = {
  user,
  session,
  account,
  verification,
  organization,
  member,
  invitation,
  orderRequest,
  studentProfile,
  organizationRelations,
  memberRelations,
};
