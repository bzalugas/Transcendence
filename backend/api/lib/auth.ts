import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { genericOAuth } from "better-auth/plugins";
import { sendSmtpEmail } from "../src/email/smtp";

const prisma = new PrismaClient();
const apiBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000";
const frontendBaseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL ?? "http://localhost:8080";

interface FortyTwoUserInfo {
  id: number;
  email: string;
  login: string;
  first_name?: string | null;
  last_name?: string | null;
  displayname?: string | null;
  image?: {
    link?: string | null;
  } | null;
  cursus_users?: Array<{
    grade?: string | null;
    level?: number | null;
  }>;
}

// Fetches the authenticated 42 profile from the access token returned by OAuth.
async function fetchFortyTwoMe(accessToken: string): Promise<FortyTwoUserInfo | null> {
  const response = await fetch("https://api.intra.42.fr/v2/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;

  return response.json();
}

// Selects the Alumni cursus level first, then Transcender, then Cadet, then falls back to any available level.
function selectFortyTwoLevel(cursusUsers?: FortyTwoUserInfo["cursus_users"]): number {
  const alumniCursus = cursusUsers?.find(
    (cursusUser) => cursusUser.grade?.toLowerCase() === "alumni",
  );
  
  const transcenderCursus = cursusUsers?.find(
    (cursusUser) => cursusUser.grade?.toLowerCase() === "transcender",
  );
  
  const cadetCursus = cursusUsers?.find(
    (cursusUser) => cursusUser.grade?.toLowerCase() === "cadet",
  );

  return (
    alumniCursus?.level ??
    transcenderCursus?.level ??
    cadetCursus?.level ??
    cursusUsers?.find((cursusUser) => cursusUser.level != null)?.level ??
    0
  );
}

// Synchronizes 42 OAuth profile fields into the local User and Profile tables.
async function syncFortyTwoProfile(userId: string, accessToken?: string | null) {
  if (!accessToken) return;

  const data = await fetchFortyTwoMe(accessToken);

  if (!data?.login) return;

  const avatarUri = data.image?.link ?? null;
  const fullName =
    data.displayname ||
    [data.first_name, data.last_name].filter(Boolean).join(" ") ||
    data.login;
  const level = selectFortyTwoLevel(data.cursus_users);

  await prisma.user.update({
    where: { id: userId },
    data: {
      login: data.login,
      name: fullName,
      image: avatarUri,
      emailVerified: true,
      profile: {
        upsert: {
          create: {
            firstname: data.first_name ?? null,
            lastname: data.last_name ?? null,
            pseudo: data.login,
            avatarUri,
            level,
          },
          update: {
            firstname: data.first_name ?? null,
            lastname: data.last_name ?? null,
            pseudo: data.login,
            avatarUri,
            level,
          },
        },
      },
    },
  });
}

export const auth = betterAuth({
  baseURL: apiBaseUrl,
  basePath: "/api/auth",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [frontendBaseUrl],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    resetPasswordTokenExpiresIn: 42 * 60,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      const credentialAccount = await prisma.account.findFirst({
        where: {
          userId: user.id,
          providerId: "credential",
        },
        select: { id: true },
      });

      if (!credentialAccount) return;

      await sendSmtpEmail({
        to: user.email,
        subject: "Reset your 42 Connect password",
        text: `We received a request to reset your 42 Connect password.\n\nReset your password: ${url}\n\nThis link expires in 42 minutes. If you did not request this, you can ignore this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Reset your 42 Connect password</h2>
            <p>We received a request to reset your password.</p>
            <p>
              <a href="${url}" style="display:inline-block;padding:10px 14px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">
                Reset password
              </a>
            </p>
            <p style="color:#6b7280;font-size:13px;">This link expires in 1 hour. If you did not request this, you can ignore this email.</p>
          </div>
        `,
      });
    },
  },

  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false,
      },
      login: {
        type: "string",
        required: false,
      },
    },
    changeEmail: {
      enabled: true,
    },
  },

  databaseHooks: {
    account: {
      create: {
        // Populates app profile data when a 42 OAuth account is first linked.
        async after(account) {
          if (account.providerId !== "42school") return;
          await syncFortyTwoProfile(account.userId, account.accessToken);
        },
      },
      update: {
        // Keeps app profile data fresh on later 42 OAuth sign-ins.
        async after(account) {
          if (account.providerId !== "42school") return;
          await syncFortyTwoProfile(account.userId, account.accessToken);
        },
      },
    },
  },

  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "42school",
          clientId: process.env.FORTY_TWO_CLIENT_ID!,
          clientSecret: process.env.FORTY_TWO_CLIENT_SECRET!,
          authorizationUrl: "https://api.intra.42.fr/oauth/authorize",
          tokenUrl: "https://api.intra.42.fr/oauth/token",
          scopes: ["public"],
          overrideUserInfo: true,

          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) return null;

            const data = await fetchFortyTwoMe(tokens.accessToken);

            if (!data) return null;

            return {
              id: String(data.id),
              email: data.email,
              emailVerified: true,
              login: data.login,
              name:
                data.displayname ||
                [data.first_name, data.last_name].filter(Boolean).join(" ") ||
                data.login,
              image: data.image?.link ?? null,
            } as any;
          },
        },
      ],
    }),
  ],
});
