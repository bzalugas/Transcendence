import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { genericOAuth } from "better-auth/plugins";

const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  trustedOrigins: [process.env.NEXT_PUBLIC_FRONTEND_URL  ?? "http://localhost:8080"],

  emailAndPassword: {
    enabled: true,
  },

  user: {
    additionalFields: {
      name: {
        type: "string",
        required: false, // Matches your schema (String?)
        // Optionally, you can add a default value if name is missing
        // defaultValue: () => "Anonymous", 
      },
    },
    // Map the incoming 'name' from signUp payload to the DB field
    changeEmail: {
      enabled: true, 
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

			getUserInfo: async (tokens) => {
				const res = await fetch("https://api.intra.42.fr/v2/me", {
					headers: {
						Authorization: `Bearer ${tokens.accessToken}`,
					},
				});

				if (!res.ok) return null;

				const data = await res.json();

				return {
					id: String(data.id),
					email: data.email,
					name: data.login,
					image: data.image?.link ?? null,
					emailVerified: true,
				} as any;
          },
		},
		],
	}),
	]
});