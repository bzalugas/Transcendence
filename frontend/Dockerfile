<<<<<<< HEAD
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
=======
FROM node:24-alpine3.22

WORKDIR /app

COPY ./package*.json .

RUN npm install

COPY . .

# RUN npm run build

ENTRYPOINT ["npm", "run"]
CMD ["dev"]
>>>>>>> dbe8aa6 (Prepare rebase from main)
