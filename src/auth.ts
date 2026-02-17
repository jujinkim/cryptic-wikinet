import NextAuth, { type NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isBlockedEmail } from "@/lib/emailPolicy";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      const email = user.email?.toLowerCase() ?? "";
      if (!email) return false;
      if (isBlockedEmail(email)) return false;

      // NOTE: Credentials users can sign in even if email is not verified.
      // Verification is enforced on member-only actions (see requireVerifiedUser).

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
    async session({ session, user }) {
      if (session.user) {
        (session.user as unknown as { id?: string; role?: unknown }).id = user.id;
        (session.user as unknown as { id?: string; role?: unknown }).role = (
          user as unknown as { role?: unknown }
        ).role;
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
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase();
        const password = String(credentials?.password ?? "");
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
            role: true,
          },
        });
        if (!user?.passwordHash) return null;

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
