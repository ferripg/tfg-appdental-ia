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
  // nextCookies() must be the LAST plugin: it wraps every response and
  // forwards Set-Cookie headers through next/headers cookies(), which is
  // required for sign-in/sign-up/sign-out called from Server Actions to
  // actually persist the session cookie in the browser.
  plugins: [nextCookies()],
});
