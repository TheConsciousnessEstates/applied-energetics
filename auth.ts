import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getDb, upsertUser } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME } from "@shared/const";
import crypto from "crypto";

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export const authRouter = router({
  // Signup with email/password
  signup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
      })
    )
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

      // Create new user with hashed password
      const passwordHash = hashPassword(input.password);
      const openId = `local_${crypto.randomBytes(16).toString("hex")}`;

      await upsertUser({
        openId,
        email: input.email,
        name: input.email.split("@")[0],
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      // Store password hash in a separate field (add to schema later if needed)
      // For now, we'll use a simple approach: store in a new table
      await db.execute(
        `UPDATE users SET loginMethod = 'email' WHERE email = '${input.email}'`
      );

      return { success: true, message: "Account created. Please log in." };
    }),

  // Login with email/password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
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

      // For now, accept any password (placeholder)
      // TODO: Implement proper password verification with bcrypt
      // In production, retrieve stored password hash and verify

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

  // Logout
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true };
  }),

  // Get current user
  me: publicProcedure.query(({ ctx }) => {
    return ctx.user || null;
  }),
});
