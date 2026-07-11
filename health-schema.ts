import { int, mysqlTable, text, timestamp, varchar, decimal, mysqlEnum } from "drizzle-orm/mysql-core";
import { users } from "./schema";

/**
 * Health platform connection status for each user.
 * Tracks which platforms are connected and last sync time.
 */
export const healthConnections = mysqlTable("health_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull().references(() => users.id),
  
  // Apple HealthKit
  appleHealthConnected: int("apple_health_connected").default(0).notNull(),
  appleHealthLastSync: timestamp("apple_health_last_sync"),
  appleHealthPermissions: text("apple_health_permissions"), // JSON: { steps, heartRate, workouts, etc. }
  
  // Google Health Connect
  googleHealthConnected: int("google_health_connected").default(0).notNull(),
  googleHealthLastSync: timestamp("google_health_last_sync"),
  googleHealthPermissions: text("google_health_permissions"), // JSON
  
  // Samsung Health
  samsungHealthConnected: int("samsung_health_connected").default(0).notNull(),
  samsungHealthLastSync: timestamp("samsung_health_last_sync"),
  samsungHealthPermissions: text("samsung_health_permissions"), // JSON
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type HealthConnection = typeof healthConnections.$inferSelect;
export type InsertHealthConnection = typeof healthConnections.$inferInsert;

/**
 * Health data synced from wearables and health platforms.
 * One record per session + health data point.
 */
export const healthData = mysqlTable("health_data", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(), // References sessions table
  userId: int("user_id").notNull().references(() => users.id),
  
  // Heart rate (bpm)
  heartRate: int("heart_rate"),
  heartRateMin: int("heart_rate_min"),
  heartRateMax: int("heart_rate_max"),
  heartRateAvg: decimal("heart_rate_avg", { precision: 5, scale: 2 }),
  
  // Heart rate variability (ms)
  hrv: decimal("hrv", { precision: 8, scale: 2 }),
  
  // Respiratory rate (breaths per minute)
  respiratoryRate: int("respiratory_rate"),
  
  // Blood oxygen saturation (%)
  spO2: decimal("spo2", { precision: 5, scale: 2 }),
  
  // Source platform
  source: mysqlEnum("source", ["apple_health", "google_health", "samsung_health"]).notNull(),
  
  // Timestamp from health platform
  recordedAt: timestamp("recorded_at").notNull(),
  
  // Metadata
  deviceName: varchar("device_name", { length: 255 }),
  dataQuality: mysqlEnum("data_quality", ["excellent", "good", "fair", "poor"]).default("good"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type HealthData = typeof healthData.$inferSelect;
export type InsertHealthData = typeof healthData.$inferInsert;

/**
 * Health data correlation summary per session.
 * Aggregated metrics for quick dashboard display.
 */
export const healthDataSummary = mysqlTable("health_data_summary", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("session_id").notNull(),
  userId: int("user_id").notNull().references(() => users.id),
  
  // Aggregated heart rate
  avgHeartRate: decimal("avg_heart_rate", { precision: 5, scale: 2 }),
  maxHeartRate: int("max_heart_rate"),
  minHeartRate: int("min_heart_rate"),
  
  // HRV
  avgHrv: decimal("avg_hrv", { precision: 8, scale: 2 }),
  
  // Respiratory rate
  avgRespiratoryRate: decimal("avg_respiratory_rate", { precision: 5, scale: 2 }),
  
  // Blood oxygen
  avgSpO2: decimal("avg_spo2", { precision: 5, scale: 2 }),
  
  // Data sources present
  sourcesPresentJson: text("sources_present"), // JSON array: ["apple_health", "google_health"]
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
});

export type HealthDataSummary = typeof healthDataSummary.$inferSelect;
export type InsertHealthDataSummary = typeof healthDataSummary.$inferInsert;
