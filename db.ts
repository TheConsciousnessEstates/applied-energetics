import { and, desc, eq, gte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  athleteProfiles,
  protocols,
  sessions,
  stageAssessments,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─── Athlete Profiles ────────────────────────────────────────────────────────

export async function getAthleteProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(athleteProfiles)
    .where(eq(athleteProfiles.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertAthleteProfile(
  userId: number,
  data: Omit<typeof athleteProfiles.$inferInsert, "id" | "userId" | "createdAt" | "updatedAt">
) {
  const db = await getDb();
  if (!db) return;
  const existing = await getAthleteProfile(userId);
  if (existing) {
    await db.update(athleteProfiles).set(data).where(eq(athleteProfiles.userId, userId));
  } else {
    await db.insert(athleteProfiles).values({ userId, ...data });
  }
}

// ─── Protocols ───────────────────────────────────────────────────────────────

export async function getAllProtocols() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocols).orderBy(protocols.sortOrder);
}

export async function getProtocolById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(protocols).where(eq(protocols.id, id)).limit(1);
  return result[0];
}

export async function getProtocolBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(protocols).where(eq(protocols.slug, slug)).limit(1);
  return result[0];
}

export async function getFreeProtocols() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(protocols).where(eq(protocols.isFreeAccess, true)).orderBy(protocols.sortOrder);
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export async function createSession(data: typeof sessions.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(sessions).values(data);
  return result[0];
}

export async function updateSession(id: number, userId: number, data: Partial<typeof sessions.$inferInsert>) {
  const db = await getDb();
  if (!db) return;
  await db.update(sessions).set(data).where(and(eq(sessions.id, id), eq(sessions.userId, userId)));
}

export async function getUserSessions(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      session: sessions,
      protocol: protocols,
    })
    .from(sessions)
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(eq(sessions.userId, userId))
    .orderBy(desc(sessions.startedAt))
    .limit(limit);
}

export async function getSessionById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({ session: sessions, protocol: protocols })
    .from(sessions)
    .leftJoin(protocols, eq(sessions.protocolId, protocols.id))
    .where(and(eq(sessions.id, id), eq(sessions.userId, userId)))
    .limit(1);
  return result[0];
}

export async function getUserSessionStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const allSessions = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), eq(sessions.completed, true)));

  const totalSessions = allSessions.length;
  const totalMinutes = Math.floor(allSessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60);

  // Sessions in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentSessions = allSessions.filter((s) => s.startedAt >= thirtyDaysAgo);

  // Streak calculation
  const sessionDates = Array.from(new Set(allSessions.map((s) => s.startedAt.toISOString().split("T")[0]))).sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().split("T")[0];
  let checkDate = today;
  for (const date of sessionDates) {
    if (date === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split("T")[0];
    } else break;
  }

  // Average perceived exertion
  const exertionSessions = allSessions.filter((s) => s.perceivedExertion !== null);
  const avgExertion =
    exertionSessions.length > 0
      ? exertionSessions.reduce((sum, s) => sum + (s.perceivedExertion ?? 0), 0) / exertionSessions.length
      : 0;

  return { totalSessions, totalMinutes, streak, recentSessions, avgExertion };
}

export async function getSessionFrequencyLast30Days(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gte(sessions.startedAt, thirtyDaysAgo), eq(sessions.completed, true)))
    .orderBy(sessions.startedAt);
}

// ─── Stage Assessments ───────────────────────────────────────────────────────

export async function createStageAssessment(data: typeof stageAssessments.$inferInsert) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(stageAssessments).values(data);
  return result[0];
}

export async function getLatestStageAssessment(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(stageAssessments)
    .where(eq(stageAssessments.userId, userId))
    .orderBy(desc(stageAssessments.assessmentDate))
    .limit(1);
  return result[0];
}

export async function getUserStageAssessments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(stageAssessments)
    .where(eq(stageAssessments.userId, userId))
    .orderBy(desc(stageAssessments.assessmentDate));
}
