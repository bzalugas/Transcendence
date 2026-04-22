FROM oven/bun:1 AS base
WORKDIR /api

COPY package.json bun.lock ./
RUN bun install

# -- DEV envrionment --
FROM base AS dev
COPY . .
# CMD ["bun", "run", "start:dev"]

# -- BUILD --
FROM base AS build
COPY . .
RUN bun run build
RUN bunx prisma generate

# -- PROD --
FROM oven/bun:1 AS prod
WORKDIR /api

COPY --from=build /api/dist ./dist
COPY --from=build /api/node_modules ./node_modules
COPY package.json bun.lockb ./

CMD ["sh", "-c", "bunx prisma migrate deploy && bun run start:prod"]
