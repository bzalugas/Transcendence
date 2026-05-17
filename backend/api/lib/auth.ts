import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { genericOAuth } from "better-auth/plugins";
import { sendSmtpEmail } from "../src/email/smtp";

const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  "licohen@student.42.fr",
  "ilavillu@student.42.fr",
  "albestae@student.42.fr",
  "bazaluga@student.42.fr",
  "ade-sarr@student.42.fr",
];

const apiBaseUrl =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "https://localhost";
const frontendBaseUrl =
  process.env.NEXT_PUBLIC_FRONTEND_URL ?? "https://localhost";
const fortyTwoRedirectUri =
  process.env.FORTY_TWO_REDIRECT_URI ??
  `${apiBaseUrl.replace(/\/+$/, "")}/api/auth/oauth2/callback/42school`;
const trustedOrigins = Array.from(
  new Set([
    frontendBaseUrl,
    "https://localhost",
  ]),
);

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
    begin_at?: string | null;
    end_at?: string | null;
    grade?: string | null;
    level?: number | null;
    cursus_id?: number | null;
    cursus?: {
      id?: number | null;
      name?: string | null;
      slug?: string | null;
    } | null;
  }>;
}

const pendingFortyTwoProfiles = new Map<string, FortyTwoUserInfo>();

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

// Selects the most relevant cursus level: current main 42 cursus first, then older main cursus entries, then any usable level.
function selectFortyTwoLevel(cursusUsers?: FortyTwoUserInfo["cursus_users"]): number {
  const withLevel = cursusUsers?.filter((cursusUser) => cursusUser.level != null) ?? [];

  return (
    [...withLevel].sort((a, b) => cursusPriority(b) - cursusPriority(a))[0]?.level ??
    0
  );
}

function cursusPriority(cursusUser: NonNullable<FortyTwoUserInfo["cursus_users"]>[number]): number {
  const mainCursusBonus = isMainFortyTwoCursus(cursusUser) ? 100 : 0;
  const activeBonus = isActiveCursus(cursusUser) ? 10 : 0;

  return mainCursusBonus + activeBonus + beginAtTimestamp(cursusUser) / 1_000_000_000_000_000;
}

function isMainFortyTwoCursus(
  cursusUser: NonNullable<FortyTwoUserInfo["cursus_users"]>[number],
): boolean {
  const cursusId = cursusUser.cursus?.id ?? cursusUser.cursus_id;
  const cursusName = cursusUser.cursus?.name?.toLowerCase() ?? "";
  const cursusSlug = cursusUser.cursus?.slug?.toLowerCase() ?? "";

  return (
    cursusId === 21 ||
    cursusId === 2 ||
    cursusName === "42" ||
    cursusName.includes("42cursus") ||
    cursusSlug === "42" ||
    cursusSlug.includes("42cursus")
  );
}

function isActiveCursus(
  cursusUser: NonNullable<FortyTwoUserInfo["cursus_users"]>[number],
): boolean {
  if (!cursusUser.begin_at) return cursusUser.end_at == null;

  const now = Date.now();
  const beginAt = Date.parse(cursusUser.begin_at);
  const endAt = cursusUser.end_at ? Date.parse(cursusUser.end_at) : null;

  return !Number.isNaN(beginAt) && beginAt <= now && (endAt === null || endAt >= now);
}

function beginAtTimestamp(
  cursusUser: NonNullable<FortyTwoUserInfo["cursus_users"]>[number],
): number {
  if (!cursusUser.begin_at) return 0;

  const timestamp = Date.parse(cursusUser.begin_at);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

// Synchronizes 42 OAuth profile fields into the local User and Profile tables.
async function syncFortyTwoProfile(
  userId: string,
  accessToken?: string | null,
  accountId?: string | null,
) {
  const data =
    (accountId ? pendingFortyTwoProfiles.get(accountId) : undefined) ??
    (accessToken ? await fetchFortyTwoMe(accessToken) : null);

  if (accountId) {
    pendingFortyTwoProfiles.delete(accountId);
  }

  if (!data?.login) return;

  await syncFortyTwoProfileData(userId, data);
}

async function syncFortyTwoProfileData(userId: string, data: FortyTwoUserInfo) {
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
            level,
          },
        },
      },
    },
  });
}

// Refreshes existing 42 users during every OAuth sign-in. New users are handled by the account create hook.
async function refreshKnownFortyTwoProfile(data: FortyTwoUserInfo) {
  const account = await prisma.account.findFirst({
    where: {
      providerId: "42school",
      accountId: String(data.id),
    },
    select: {
      userId: true,
    },
  });
  const user =
    account ??
    (await prisma.user.findUnique({
      where: {
        email: data.email,
      },
      select: {
        id: true,
      },
    }));

  if (!user) return;

  await syncFortyTwoProfileData("userId" in user ? user.userId : user.id, data);
}

export const auth = betterAuth({
  baseURL: apiBaseUrl,
  basePath: "/api/auth",

  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins,

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
        // Populates app profile data when a 42 OAuth account is first linked, and assigns role.
        async after(account) {
          if (account.providerId === "42school") {
            await syncFortyTwoProfile(
              account.userId,
              account.accessToken,
              account.accountId,
            );
          }

          const user = await prisma.user.findUnique({
            where: { id: account.userId },
            select: { email: true },
          });

          const role = ADMIN_EMAILS.includes(user?.email ?? "")
            ? "ADMIN"
            : account.providerId === "42school"
              ? "USER"
              : "GUEST";

          await prisma.user.update({
            where: { id: account.userId },
            data: { role },
          });
        },
      },
      update: {
        // Keeps app profile data fresh on later 42 OAuth sign-ins.
        async after(account) {
          if (account.providerId !== "42school") return;
          await syncFortyTwoProfile(
            account.userId,
            account.accessToken,
            account.accountId,
          );
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
          redirectURI: fortyTwoRedirectUri,
          scopes: ["public"],
          overrideUserInfo: true,

          getUserInfo: async (tokens) => {
            if (!tokens.accessToken) return null;

            const data = await fetchFortyTwoMe(tokens.accessToken);

            if (!data) return null;
            pendingFortyTwoProfiles.set(String(data.id), data);
            await refreshKnownFortyTwoProfile(data);

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
