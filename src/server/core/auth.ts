import { PrismaAdapter } from "@next-auth/prisma-adapter";
import {
  getServerSession,
  type NextAuthOptions,
  type DefaultSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/server/core/db";
import { normalizeEmail, verifyPassword } from "@/server/auth/password";
import {
  getAdminCredentialsConfig,
  isOwnerEmail,
} from "@/server/core/roles";

const resolvedAuthSecret =
  process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;

if (!resolvedAuthSecret && process.env.NODE_ENV === "production") {
  throw new Error(
    "Missing NextAuth secret. Set NEXTAUTH_SECRET (or AUTH_SECRET) in your environment.",
  );
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      isAdmin?: boolean;
      isOwner?: boolean;
      banned?: boolean;
      revoked?: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin?: boolean;
    isOwner?: boolean;
    banned?: boolean;
    revoked?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  // In development we allow a deterministic fallback to avoid local boot failures.
  // Production always requires NEXTAUTH_SECRET/AUTH_SECRET.
  secret: resolvedAuthSecret ?? "local-dev-nextauth-secret",
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return true;
      }

      const db_user = await prisma.user.findUnique({
        where: { email: user.email },
        select: { banned: true, revoked: true },
      });
      if (db_user?.banned || db_user?.revoked) {
        // Block sign in for banned/revoked users.
        return false;
      }
      return true;
    },
    jwt: async ({ token }) => {
      const whereClause =
        typeof token.email === "string" && token.email.trim().length > 0
          ? { email: token.email }
          : typeof token.sub === "string" && token.sub.trim().length > 0
            ? { id: token.sub }
            : null;

      if (!whereClause) {
        return token;
      }

      const db_user = await prisma.user.findUnique({
        where: whereClause,
      });
      if (db_user) {
        token.id = db_user.id;
        token.isAdmin = db_user.isAdmin;
        token.isOwner = isOwnerEmail(db_user.email);
        token.banned = db_user.banned;
        token.name = db_user.name;
        token.email = db_user.email;
        token.picture = db_user.image;
        token.revoked = db_user.revoked;

        let retries = 3;
        while (retries > 0) {
          try {
            await prisma.user.update({
              where: { id: db_user.id },
              data: { isOnline: true },
            });
            break; // success, exit loop
          } catch (err: unknown) {
            const code =
              typeof err === "object" &&
              err !== null &&
              "code" in err &&
              typeof (err as { code?: unknown }).code === "string"
                ? (err as { code: string }).code
                : undefined;

            const message =
              typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof (err as { message?: unknown }).message === "string"
                ? (err as { message: string }).message
                : undefined;

            if (
              retries > 1 &&
              (code === "P2034" ||
                (message && message.includes("Lock wait timeout")))
            ) {
              await new Promise((res) => setTimeout(res, 500));
              retries--;
            } else {
              throw err;
            }
          }
        }
      }
      return token;
    },
    session: ({ session, token }) => {
      if (token.id) {
        session.user.id = token.id;
        session.user.isAdmin = token.isAdmin;
        session.user.isOwner = token.isOwner;
        session.user.banned = token.banned;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.user.revoked = token.revoked;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Admin Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const {
          username,
          password,
          loginEmail,
          displayName,
        } = getAdminCredentialsConfig();

        if (isOwnerEmail(loginEmail)) {
          return null;
        }

        const providedUsername =
          typeof credentials?.username === "string"
            ? credentials.username.trim()
            : "";
        const providedPassword =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (providedUsername !== username || providedPassword !== password) {
          return null;
        }

        const adminUser = await prisma.user.upsert({
          where: { email: loginEmail },
          update: {
            name: displayName,
            isAdmin: true,
          },
          create: {
            email: loginEmail,
            name: displayName,
            isAdmin: true,
          },
        });

        if (adminUser.banned || adminUser.revoked) {
          return null;
        }

        return {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
        };
      },
    }),
    CredentialsProvider({
      id: "user-credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? normalizeEmail(credentials.email)
            : "";
        const password =
          typeof credentials?.password === "string"
            ? credentials.password
            : "";

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash || !user.emailVerified) {
          return null;
        }

        if (user.banned || user.revoked) {
          return null;
        }

        const validPassword = await verifyPassword(password, user.passwordHash);
        if (!validPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
};

async function getTestSessionFromRequest(req?: Request) {
  if (process.env.NODE_ENV !== "test" || !req) {
    return null;
  }

  const testEmail = req.headers.get("x-test-user-email")?.trim();
  if (!testEmail) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!user) {
    return null;
  }

  return {
    user: {
      id: user.id,
      isAdmin: user.isAdmin,
      isOwner: isOwnerEmail(user.email),
      banned: user.banned,
      revoked: user.revoked,
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      image: user.image ?? undefined,
    },
  };
}

export const getAuthSession = async (req?: Request) => {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user) {
      return session;
    }
  } catch {
    // In isolated route tests there may be no request scope for next-auth.
  }

  return getTestSessionFromRequest(req);
};
