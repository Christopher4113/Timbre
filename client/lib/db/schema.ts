import { sql } from "drizzle-orm";
import { bigint, boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { VoiceProfile } from "@/lib/schema";

// ---- Better Auth tables (adapter uses usePlural: true) ----
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Better Auth's own limiter for /api/auth/* (storage: "database").
export const rateLimits = pgTable("rate_limits", {
  id: text("id").primaryKey(),
  key: text("key").notNull().unique(),
  count: integer("count").notNull(),
  lastRequest: bigint("last_request", { mode: "number" }).notNull(),
});

// ---- App tables ----
const userId = () => text("user_id").notNull().references(() => users.id, { onDelete: "cascade" });
const createdAt = () => timestamp("created_at").notNull().defaultNow();

export const consents = pgTable("consents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  version: text("version").notNull(),
  scopes: jsonb("scopes").$type<Record<string, boolean>>().notNull(),
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
});

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  conversationId: text("conversation_id").notNull().unique(),
  transcript: jsonb("transcript"),
  scenarioSegments: jsonb("scenario_segments"),
  status: text("status").notNull().default("pending"),
  createdAt: createdAt(),
});

export const samples = pgTable("samples", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  context: text("context", { enum: ["outreach", "application", "casual", "technical", "other"] }).notNull(),
  text: text("text").notNull(),
  aiDraft: text("ai_draft"),
  createdAt: createdAt(),
});

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: userId(),
    version: integer("version").notNull(),
    parentVersion: integer("parent_version"),
    data: jsonb("data").$type<VoiceProfile>().notNull(),
    source: text("source").notNull(),
    promptVersion: text("prompt_version"),
    model: text("model"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("profiles_user_version").on(t.userId, t.version)],
);

export const profileJobs = pgTable("profile_jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  status: text("status").notNull().default("queued"),
  error: text("error"),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "set null" }),
  createdAt: createdAt(),
});

export const comparisons = pgTable("comparisons", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: userId(),
  profileId: uuid("profile_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
  task: text("task").notNull(),
  baselineOutput: text("baseline_output").notNull(),
  profileOutput: text("profile_output").notNull(),
  leftIs: text("left_is", { enum: ["baseline", "profile"] }).notNull(),
  picked: text("picked", { enum: ["baseline", "profile"] }),
  sendAsIs: boolean("send_as_is"),
  editedText: text("edited_text"),
  editDistance: integer("edit_distance"),
  model: text("model").notNull(),
  promptVersion: text("prompt_version"),
  createdAt: createdAt(),
});

// Fixed-window counters for AI endpoints, keyed "<userId>:<bucket>".
export const aiUsage = pgTable("ai_usage", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  windowStart: timestamp("window_start").notNull().default(sql`now()`),
});
