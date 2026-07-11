import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { hashPassword, verifyPassword } from "./password";
import { eq } from "drizzle-orm";
import {
  createSession,
  createStageAssessment,
  getAllProtocols,
  getAthleteProfile,
  getFreeProtocols,
  getLatestStageAssessment,
  getProtocolById,
  getProtocolBySlug,
  getSessionById,
  getSessionFrequencyLast30Days,
  getUserById,
  getUserSessionStats,
  getUserSessions,
  getUserStageAssessments,
  updateSession,
  updateUser,
  upsertAthleteProfile,
  getDb,
  upsertUser,
} from "./db";
import { users } from "../drizzle/schema";

// ─── Subscription tier access helper ────────────────────────────────────────
const TIER_RANK: Record<string, number> = { free: 0, pro: 1, elite: 2 };
function hasAccess(userTier: string, requiredTier: string) {
  return (TIER_RANK[userTier] ?? 0) >= (TIER_RANK[requiredTier] ?? 0);
}

// ─── Routers ─────────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    signup: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string().min(6) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Check if user already exists
        const existing = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Email already registered",
          });
        }

        // Hash password and create user
        const passwordHash = await hashPassword(input.password);
        const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        await upsertUser({
          openId,
          email: input.email,
          name: input.email.split("@")[0],
          loginMethod: "email",
          passwordHash,
          lastSignedIn: new Date(),
        });

        return { success: true, message: "Account created. Please log in." };
      }),
    login: publicProcedure
      .input(z.object({ email: z.string().email(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Find user by email
        const userList = await db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (userList.length === 0) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        const user = userList[0];

        // Verify password
        if (!user.passwordHash || !(await verifyPassword(input.password, user.passwordHash))) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }

        // Set session cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, user.openId, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return {
          success: true,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
        };
      }),
  }),

  // ── Users / Profile ───────────────────────────────────────────────────────
  user: router({
    me: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      const profile = await getAthleteProfile(ctx.user.id);
      return { user, profile };
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          sport: z.string().optional(),
          experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]).optional(),
          trainingGoals: z.array(z.string()).optional(),
          weeklyTrainingDays: z.number().min(1).max(7).optional(),
          primaryFocus: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { name, ...profileData } = input;
        if (name) await updateUser(ctx.user.id, { name });
        if (Object.keys(profileData).length > 0) {
          await upsertAthleteProfile(ctx.user.id, profileData);
        }
        return { success: true };
      }),

    completeOnboarding: protectedProcedure
      .input(
        z.object({
          sport: z.string(),
          experienceLevel: z.enum(["beginner", "intermediate", "advanced", "elite"]),
          trainingGoals: z.array(z.string()),
          weeklyTrainingDays: z.number().min(1).max(7),
          primaryFocus: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await upsertAthleteProfile(ctx.user.id, input);
        await updateUser(ctx.user.id, { onboardingCompleted: true });
        return { success: true };
      }),
  }),

  // ── Protocols ─────────────────────────────────────────────────────────────
  protocols: router({
    list: publicProcedure
      .input(
        z.object({
          stage: z.number().min(1).max(4).optional(),
          element: z.enum(["air", "fire", "water", "earth", "ether"]).optional(),
          chakra: z.string().optional(),
        }).optional()
      )
      .query(async ({ ctx, input }) => {
        const userTier = ctx.user?.subscriptionTier ?? "free";
        const all = await getAllProtocols();

        let filtered = all;
        if (input?.stage) filtered = filtered.filter((p) => p.stageRequired === input.stage);
        if (input?.element) filtered = filtered.filter((p) => p.element === input.element);
        if (input?.chakra) {
          filtered = filtered.filter((p) =>
            (p.chakraFocus as string[]).includes(input.chakra!)
          );
        }

        // Attach access flag — free users only see free protocols
        return filtered.map((p) => ({
          ...p,
          accessible: userTier !== "free" || p.isFreeAccess,
        }));
      }),

    get: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ ctx, input }) => {
        const protocol = await getProtocolBySlug(input.slug);
        if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });

        const userTier = ctx.user?.subscriptionTier ?? "free";
        const accessible = userTier !== "free" || protocol.isFreeAccess;
        if (!accessible) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Pro to access this protocol." });
        }
        return protocol;
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const protocol = await getProtocolById(input.id);
        if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });

        const userTier = ctx.user.subscriptionTier ?? "free";
        const accessible = userTier !== "free" || protocol.isFreeAccess;
        if (!accessible) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Pro to access this protocol." });
        }
        return protocol;
      }),
  }),

  // ── Sessions ──────────────────────────────────────────────────────────────
  sessions: router({
    start: protectedProcedure
      .input(z.object({ protocolId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Verify protocol access
        const protocol = await getProtocolById(input.protocolId);
        if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
        const userTier = ctx.user.subscriptionTier ?? "free";
        if (userTier === "free" && !protocol.isFreeAccess) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Pro to access this protocol." });
        }

        await createSession({
          userId: ctx.user.id,
          protocolId: input.protocolId,
          startedAt: new Date(),
          completed: false,
          durationSeconds: 0,
        });
        return { success: true };
      }),

    complete: protectedProcedure
      .input(
        z.object({
          protocolId: z.number(),
          durationSeconds: z.number().min(0),
          perceivedExertion: z.number().min(1).max(10),
          notes: z.string().optional(),
          chakraActivation: z.number().min(1).max(7).optional(),
          startingBreathRate: z.number().optional(),
          endingBreathRate: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Verify protocol access
        const protocol = await getProtocolById(input.protocolId);
        if (!protocol) throw new TRPCError({ code: "NOT_FOUND" });
        const userTier = ctx.user.subscriptionTier ?? "free";
        if (userTier === "free" && !protocol.isFreeAccess) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Upgrade to Pro to access this protocol." });
        }

        await createSession({
          userId: ctx.user.id,
          protocolId: input.protocolId,
          startedAt: new Date(),
          completedAt: new Date(),
          durationSeconds: input.durationSeconds,
          completed: true,
          perceivedExertion: input.perceivedExertion,
          notes: input.notes ?? null,
          chakraActivation: input.chakraActivation ?? null,
          startingBreathRate: input.startingBreathRate ?? null,
          endingBreathRate: input.endingBreathRate ?? null,
        });

        // Update user stats
        const stats = await getUserSessionStats(ctx.user.id);
        if (stats) {
          await updateUser(ctx.user.id, {
            totalSessions: stats.totalSessions,
            streakCount: stats.streak,
            lastActive: new Date(),
          });
        }

        return { success: true };
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(50) }).optional())
      .query(async ({ ctx, input }) => {
        return getUserSessions(ctx.user.id, input?.limit ?? 50);
      }),

    stats: protectedProcedure.query(async ({ ctx }) => {
      // Basic stats for free, full analytics for pro/elite
      const userTier = ctx.user.subscriptionTier ?? "free";
      const stats = await getUserSessionStats(ctx.user.id);
      const frequency = hasAccess(userTier, "pro")
        ? await getSessionFrequencyLast30Days(ctx.user.id)
        : [];
      return { ...stats, frequency, analyticsLocked: !hasAccess(userTier, "pro") };
    }),
  }),

  // ── Stage Assessment ──────────────────────────────────────────────────────
  assessment: router({
    submit: protectedProcedure
      .input(
        z.object({
          answers: z.record(z.string(), z.number()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Score the assessment
        const scores = Object.values(input.answers);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

        let stage = 1;
        if (avg >= 3.5) stage = 4;
        else if (avg >= 2.5) stage = 3;
        else if (avg >= 1.5) stage = 2;

        // Get recommended protocols for this stage
        const all = await getAllProtocols();
        const recommended = all
          .filter((p) => p.stageRequired === stage)
          .slice(0, 3)
          .map((p) => p.id);

        await createStageAssessment({
          userId: ctx.user.id,
          stage,
          answers: input.answers,
          recommendedProtocols: recommended,
        });

        await updateUser(ctx.user.id, { currentStage: stage });

        return { stage, recommendedProtocols: recommended };
      }),

    latest: protectedProcedure.query(async ({ ctx }) => {
      return getLatestStageAssessment(ctx.user.id);
    }),

    history: protectedProcedure.query(async ({ ctx }) => {
      return getUserStageAssessments(ctx.user.id);
    }),
  }),

  // ── Subscription ──────────────────────────────────────────────────────────
  subscription: router({
    status: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      return {
        tier: user?.subscriptionTier ?? "free",
        status: user?.subscriptionStatus ?? "inactive",
        currentPeriodEnd: user?.subscriptionCurrentPeriodEnd,
        stripeCustomerId: user?.stripeCustomerId,
      };
    }),

    createCheckout: protectedProcedure
      .input(z.object({ tier: z.enum(["pro", "elite"]) }))
      .mutation(async ({ ctx, input }) => {
        const { createSubscriptionCheckout } = await import("./stripe/checkout");
        const user = await getUserById(ctx.user.id);
        const origin = (ctx.req.headers.origin as string) ?? "https://applied-energetics.manus.space";
        const checkoutUrl = await createSubscriptionCheckout({
          tier: input.tier,
          userId: ctx.user.id,
          userEmail: user?.email,
          userName: user?.name,
          origin,
        });
        return { checkoutUrl };
      }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      if (!user?.stripeSubscriptionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found." });
      }
      const { cancelSubscription } = await import("./stripe/checkout");
      await cancelSubscription(user.stripeSubscriptionId);
      await updateUser(ctx.user.id, { subscriptionStatus: "canceled" });
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
