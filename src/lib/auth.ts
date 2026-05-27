import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/repositories/prisma-client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: ["http://localhost", "http://localhost:3000"],
  // Expose the `role` column from the Prisma `user` table to `session.user`
  // so RBAC gates (requireAdmin) can read `session.user.role`. Without this
  // additionalFields declaration, Better Auth omits role from the inferred
  // session shape and every check would compare `undefined !== "ADMIN"`.
  // `input: false` blocks clients from setting role via signUpEmail — only
  // the admin-controlled write path in usersService can change it.
  user: {
    additionalFields: {
      role: { type: "string", input: false },
    },
  },
  // nextCookies() must be the LAST plugin: it wraps every response and
  // forwards Set-Cookie headers through next/headers cookies(), which is
  // required for sign-in/sign-up/sign-out called from Server Actions to
  // actually persist the session cookie in the browser.
  plugins: [nextCookies()],
});
