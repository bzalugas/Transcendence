FROM oven/bun:1 AS base
WORKDIR /api

COPY package.json bun.lock ./
RUN bun install

# -- DEV envrionment --
FROM base AS dev
COPY . .
# CMD ["bun", "run", "start:dev"]
RUN bunx prisma generate

# -- BUILD --
FROM base AS build
COPY . .
RUN bun run build

RUN bunx prisma generate

RUN if [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then \
      mkdir -p prisma/migrations/0_init && \
      bunx prisma migrate diff \
        --from-empty \
        --to-schema-datamodel prisma/schema.prisma \
        --script > prisma/migrations/0_init/migration.sql; \
      echo "✅ Initial migration generated"; \
    else \
      echo "✅ Migrations already exist, skipping generation"; \
    fi

# -- PROD --
FROM oven/bun:1 AS prod
WORKDIR /api

COPY --from=build /api/dist ./dist
COPY --from=build /api/node_modules ./node_modules
COPY package.json bun.lockb ./

COPY ./tools/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["bun", "run", "start:prod"]
ENTRYPOINT ["./entrypoint.sh"]
