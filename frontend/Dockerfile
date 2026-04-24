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

COPY --from=build /app/dist ./dist

CMD ["bun", "x", "serve", "-s", "dist", "-l", "8080"]
