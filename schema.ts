import {
  boolean,
  float,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

// ─── Users ──────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  loginMethod: varchar("loginMethod", { length: 64 }),
  passwordHash: text("passwordHash"),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  // Subscription
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "pro", "elite"])
    .default("free")
    .notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 32 }).default("inactive"),
  subscriptionCurrentPeriodEnd: timestamp("subscriptionCurrentPeriodEnd"),
  // Progress
  currentStage: int("currentStage").default(1).notNull(),
  totalSessions: int("totalSessions").default(0).notNull(),
  streakCount: int("streakCount").default(0).notNull(),
  lastActive: timestamp("lastActive"),
  // Onboarding
  onboardingCompleted: boolean("onboardingCompleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Athlete Profiles ────────────────────────────────────────────────────────
export const athleteProfiles = mysqlTable("athlete_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sport: varchar("sport", { length: 64 }),
  experienceLevel: mysqlEnum("experienceLevel", ["beginner", "intermediate", "advanced", "elite"]),
  trainingGoals: json("trainingGoals").$type<string[]>(),
  weeklyTrainingDays: int("weeklyTrainingDays"),
  primaryFocus: varchar("primaryFocus", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AthleteProfile = typeof athleteProfiles.$inferSelect;
export type InsertAthleteProfile = typeof athleteProfiles.$inferInsert;

// ─── Protocols ───────────────────────────────────────────────────────────────
export const protocols = mysqlTable("protocols", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  stageRequired: int("stageRequired").notNull(), // 1-4
  chakraFocus: json("chakraFocus").$type<string[]>().notNull(),
  element: mysqlEnum("element", ["air", "fire", "water", "earth", "ether"]).notNull(),
  durationMinutes: int("durationMinutes").notNull(),
  targetBreathRate: float("targetBreathRate").notNull(), // breaths per minute
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced", "master"]).notNull(),
  description: text("description"),
  steps: json("steps").$type<string[]>().notNull(),
  // Breathing pattern (seconds)
  inhaleSeconds: float("inhaleSeconds").notNull(),
  holdAfterInhaleSeconds: float("holdAfterInhaleSeconds").default(0).notNull(),
  exhaleSeconds: float("exhaleSeconds").notNull(),
  holdAfterExhaleSeconds: float("holdAfterExhaleSeconds").default(0).notNull(),
  // Metadata
  soundFrequency: varchar("soundFrequency", { length: 16 }), // e.g. "396hz"
  chakraSoundSyllable: varchar("chakraSoundSyllable", { length: 16 }), // e.g. "AHHH"
  tags: json("tags").$type<string[]>(),
  isFreeAccess: boolean("isFreeAccess").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Protocol = typeof protocols.$inferSelect;
export type InsertProtocol = typeof protocols.$inferInsert;

// ─── Sessions ────────────────────────────────────────────────────────────────
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  protocolId: int("protocolId").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  durationSeconds: int("durationSeconds").default(0).notNull(),
  completed: boolean("completed").default(false).notNull(),
  // Session Logger fields (all four required)
  perceivedExertion: int("perceivedExertion"), // 1-10
  notes: text("notes"),
  chakraActivation: int("chakraActivation"), // 1-7
  startingBreathRate: float("startingBreathRate"),
  endingBreathRate: float("endingBreathRate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

// ─── Stage Assessments ───────────────────────────────────────────────────────
export const stageAssessments = mysqlTable("stage_assessments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  assessmentDate: timestamp("assessmentDate").defaultNow().notNull(),
  stage: int("stage").notNull(), // 1-4
  answers: json("answers").$type<Record<string, number>>(),
  indicators: json("indicators").$type<string[]>(),
  recommendedProtocols: json("recommendedProtocols").$type<number[]>(),
});

export type StageAssessment = typeof stageAssessments.$inferSelect;
export type InsertStageAssessment = typeof stageAssessments.$inferInsert;
