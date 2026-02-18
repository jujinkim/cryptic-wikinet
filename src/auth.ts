import NextAuth, { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isBlockedEmail } from "@/lib/emailPolicy";
import { consumeAuthRateLimit, getRequestIp } from "@/lib/authRateLimit";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase() ?? "";
      if (!email) return false;
      if (isBlockedEmail(email)) return false;

      // Block login if the account is still unverified after 24 hours.
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, emailVerified: true, createdAt: true },
      });
      if (dbUser && !dbUser.emailVerified) {
        const ageMs = Date.now() - dbUser.createdAt.getTime();
        if (ageMs > 1000 * 60 * 60 * 24) {
          return false;
        }
      }

      // If signing in with OAuth, mark email verified when the provider asserts verification.
      // (This prevents OAuth-created users from being blocked by requireVerifiedUser.)
      if (account?.provider !== "credentials") {
        const emailVerifiedFlag = (profile as unknown as { email_verified?: unknown } | null)
          ?.email_verified;
        const isVerified = emailVerifiedFlag === true || emailVerifiedFlag === "true";
        if (isVerified) {
          const current = await prisma.user.findUnique({
            where: { id: user.id },
            select: { emailVerified: true },
          });
          if (!current?.emailVerified) {
            await prisma.user.update({
              where: { id: user.id },
              data: { emailVerified: new Date() },
            });
          }
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      // Persist user id/role into the JWT.
      if (user?.id) {
        (token as unknown as { id?: string }).id = user.id;
        const row = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        (token as unknown as { role?: unknown }).role = row?.role ?? "MEMBER";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const id =
          (token as unknown as { id?: string }).id ??
          (token.sub ? String(token.sub) : undefined);

        (session.user as unknown as { id?: string; role?: unknown }).id = id;

        // Always fetch the latest role from DB.
        // This ensures role changes (e.g. make-admin) apply without requiring re-login.
        if (id) {
          const row = await prisma.user.findUnique({
            where: { id },
            select: { role: true },
          });
          (session.user as unknown as { role?: unknown }).role = row?.role ?? "MEMBER";
        } else {
          (session.user as unknown as { role?: unknown }).role = "MEMBER";
        }
      }
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      allowDangerousEmailAccountLinking: false,
    }),
    Credentials({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = String(credentials?.email ?? "").toLowerCase();
        const password = String(credentials?.password ?? "");

        const ip = req ? getRequestIp(req) : "unknown";
        const rl = await consumeAuthRateLimit({
          action: "login",
          ip,
          email,
          ipWindowSec: Number(process.env.RL_AUTH_LOGIN_IP_WINDOW_SEC ?? 900),
          ipMax: Number(process.env.RL_AUTH_LOGIN_IP_MAX ?? 30),
          emailWindowSec: Number(process.env.RL_AUTH_LOGIN_EMAIL_WINDOW_SEC ?? 900),
          emailMax: Number(process.env.RL_AUTH_LOGIN_EMAIL_MAX ?? 10),
        });
        if (!rl.ok) return null;
        if (!email || !password) return null;
        if (isBlockedEmail(email)) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            emailVerified: true,
            createdAt: true,
            role: true,
          },
        });
        if (!user?.passwordHash) return null;

        if (!user.emailVerified) {
          const ageMs = Date.now() - user.createdAt.getTime();
          if (ageMs > 1000 * 60 * 60 * 24) return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
};

const handler = NextAuth(authOptions);

export const GET = handler;
export const POST = handler;

export function auth() {
  return getServerSession(authOptions);
}
