import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Shared test helpers ──────────────────────────────────────────────────────

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function makeCtx(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-open-id",
    email: "test@example.com",
    name: "Test Athlete",
    loginMethod: "manus",
    role: "user",
    subscriptionTier: "free",
    subscriptionStatus: "inactive",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionCurrentPeriodEnd: null,
    currentStage: 1,
    totalSessions: 0,
    streakCount: 0,
    lastActive: null,
    onboardingCompleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://applied-energetics.manus.space" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
    const ctx: TrpcContext = {
      ...makeCtx(),
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();

    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ─── Protocols ────────────────────────────────────────────────────────────────

describe("protocols.list", () => {
  it("returns protocols for a public user (no auth)", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const protocols = await caller.protocols.list();
    expect(Array.isArray(protocols)).toBe(true);
  });

  it("marks non-free protocols as inaccessible for free-tier users", async () => {
    const caller = appRouter.createCaller(makeCtx({ subscriptionTier: "free" }));
    const protocols = await caller.protocols.list();
    const locked = protocols.filter((p) => !p.accessible);
    // Free tier should have some locked protocols
    expect(locked.length).toBeGreaterThan(0);
  });

  it("marks all protocols as accessible for pro-tier users", async () => {
    const caller = appRouter.createCaller(makeCtx({ subscriptionTier: "pro" }));
    const protocols = await caller.protocols.list();
    const locked = protocols.filter((p) => !p.accessible);
    expect(locked.length).toBe(0);
  });

  it("filters by stage when stage param is provided", async () => {
    const caller = appRouter.createCaller(makeCtx({ subscriptionTier: "pro" }));
    const protocols = await caller.protocols.list({ stage: 1 });
    expect(protocols.every((p) => p.stageRequired === 1)).toBe(true);
  });
});

// ─── Assessment ───────────────────────────────────────────────────────────────

describe("assessment.submit", () => {
  it("scores a full Stage 4 response correctly", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 8; i++) {
      answers[`q${i}`] = 4;
    }
    const result = await caller.assessment.submit({ answers });
    expect(result.stage).toBe(4);
    expect(Array.isArray(result.recommendedProtocols)).toBe(true);
  });

  it("scores a full Stage 1 response correctly", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 8; i++) {
      answers[`q${i}`] = 1;
    }
    const result = await caller.assessment.submit({ answers });
    expect(result.stage).toBe(1);
  });
});

// ─── Sessions ─────────────────────────────────────────────────────────────────

describe("sessions.stats", () => {
  it("returns stats for an authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const stats = await caller.sessions.stats();
    expect(stats).toHaveProperty("totalSessions");
    expect(stats).toHaveProperty("streak");
    expect(stats).toHaveProperty("analyticsLocked");
  });

  it("locks analytics for free-tier users", async () => {
    const caller = appRouter.createCaller(makeCtx({ subscriptionTier: "free" }));
    const stats = await caller.sessions.stats();
    expect(stats.analyticsLocked).toBe(true);
  });

  it("unlocks analytics for pro-tier users", async () => {
    const caller = appRouter.createCaller(makeCtx({ subscriptionTier: "pro" }));
    const stats = await caller.sessions.stats();
    expect(stats.analyticsLocked).toBe(false);
  });
});

// ─── Subscription ─────────────────────────────────────────────────────────────

describe("subscription.status", () => {
  it("returns free tier for a new user", async () => {
    const caller = appRouter.createCaller(makeCtx({ subscriptionTier: "free" }));
    const status = await caller.subscription.status();
    expect(status.tier).toBe("free");
  });
});
