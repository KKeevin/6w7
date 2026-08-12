import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
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
        const u = user as { username?: string };
        if (u.username) token.username = u.username;
      }
      if (token.sub && !token.username) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { username: true, image: true, name: true, updatedAt: true },
        });
        if (dbUser) {
          token.username = dbUser.username;
          const { avatarDisplayUrl } = await import("@/shared/avatar-url");
          token.picture = avatarDisplayUrl(dbUser.image, dbUser.updatedAt);
          token.name = dbUser.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.username = (token.username as string) || "";
        if (token.picture) session.user.image = token.picture as string;
      }
      return session;
    },
  },
  trustHost: true,
});
