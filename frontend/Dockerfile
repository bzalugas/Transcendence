FROM oven/bun:1 AS base
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install

# -- DEV environment --
FROM base AS dev
COPY . .
# CMD ["bun", "run", "dev"]

# -- BUILD --
FROM base AS build
COPY . .
RUN bun run build

# -- PROD --
FROM oven/bun:1 AS prod
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.ts ./next.config.ts

CMD ["bun", "run", "start", "--", "-p", "8080"]
