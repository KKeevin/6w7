import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rememberInferredLocale } from "@/lib/account-locale";
import { normalizeUsername } from "@/shared/slug";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(8).max(72),
});

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const parsed = credentialsSchema.safeParse(credentials);
      if (!parsed.success) return null;

      const username = normalizeUsername(parsed.data.username);
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user?.passwordHash || user.status !== "active") return null;

      const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
      if (!ok) return null;

      return {
        id: user.id,
        email: user.email ?? undefined,
        name: user.name ?? user.username,
        image: user.image,
        username: user.username,
        isDemo: user.isDemo,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        const u = user as { username?: string; isDemo?: boolean };
        if (u.username) token.username = u.username;
        token.isDemo = Boolean(u.isDemo);
      }
      if (token.sub && (!token.username || token.isDemo === undefined)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: {
            username: true,
            image: true,
            name: true,
            updatedAt: true,
            isDemo: true,
          },
        });
        if (dbUser) {
          token.username = dbUser.username;
          const { avatarDisplayUrl } = await import("@/shared/avatar-url");
          token.picture = avatarDisplayUrl(dbUser.image, dbUser.updatedAt);
          token.name = dbUser.name;
          token.isDemo = dbUser.isDemo;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username = (token.username as string) || "";
        session.user.isDemo = Boolean(token.isDemo);
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id) await rememberInferredLocale(user.id);
      const demo = Boolean((user as { isDemo?: boolean }).isDemo);
      if (demo) {
        const { resetDemoInboxFlags } = await import(
          "@/services/demo-inbox.service"
        );
        await resetDemoInboxFlags();
      }
    },
  },
  trustHost: true,
});
