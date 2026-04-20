FROM node:24-alpine3.22

WORKDIR /api

RUN apk add --no-cache netcat-openbsd openssl

COPY ./package*.json .
RUN npm install better-auth
# RUN npm ci # instead of npm install, better for production

COPY prisma ./prisma/
COPY . .

RUN if [ -z "$(ls -A prisma/migrations 2>/dev/null)" ]; then \
      mkdir -p prisma/migrations/0_init && \
      npx prisma migrate diff \
        --from-empty \
        --to-schema-datamodel prisma/schema.prisma \
        --script > prisma/migrations/0_init/migration.sql; \
      echo "✅ Initial migration generated"; \
    else \
      echo "✅ Migrations already exist, skipping generation"; \
    fi

RUN npx prisma generate

COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

EXPOSE 4000
# RUN npm run build # for production

ENTRYPOINT ["./entrypoint.sh"]
CMD ["npm", "run", "start:dev"]
