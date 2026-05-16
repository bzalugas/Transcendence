# Development and Runtime Guide

## Prerequisites

- Docker server and client
- Docker Compose
- Make

## Environment

The Docker environment file is:

```sh
docker/.env
```

It contains the database variables, Better Auth public URLs, 42 OAuth credentials, and SMTP settings.

42 OAuth must use the exact same callback URL in `docker/.env` and in the
42 application dashboard. For the default HTTPS/Caddy setup, the public URLs
should point to the public frontend origin:

```env
BETTER_AUTH_URL=https://localhost
NEXT_PUBLIC_API_URL=https://localhost
NEXT_PUBLIC_FRONTEND_URL=https://localhost
FORTY_TWO_REDIRECT_URI=https://localhost/api/auth/oauth2/callback/42school
```

## Architecture

The stack is split into four main services:

- `front`: Next.js frontend
- `api`: NestJS API with Better Auth and Prisma
- `db`: PostgreSQL
- `proxy`: Caddy reverse proxy

Public traffic goes through Caddy:

```text
https://localhost/        -> front:8080
https://localhost/api/*   -> api:3000
```

The API uses the global `/api` prefix for Nest controllers. Better Auth is mounted at:

```text
/api/auth
```

The frontend should call API routes through the public origin under `/api`.

## Default Production-Like Stack

The default Make targets now use the production Compose stack:

```sh
make
make up
```

These commands use only:

```text
docker/compose.yaml
```

Useful production/default targets:

```sh
make build
make up
make up-d
make logs
make down
make down-v
make restart
make recreate-one service=api
make recreate-one service=front
make recreate-one service=proxy
```

Compatibility aliases still exist:

```sh
make prod-up
make prod-build
make prod-recreate-one service=api
```

## Development Stack

Development mode is explicit:

```sh
make dev
```

This uses:

```text
docker/compose.yaml
docker/compose-dev.yaml
```

In dev mode, the source directories are bind-mounted into the containers:

- `frontend/` -> `/app`
- `backend/api/` -> `/api`

The dev stack exposes extra ports for debugging:

- PostgreSQL: `localhost:5433` on host, `5432` in container
- Adminer: `http://localhost:8081`
- Caddy HTTPS proxy: `https://localhost`

Useful dev targets:

```sh
make dev-up
make dev-up-d
make dev-build
make dev-logs
make dev-down
make dev-down-v
make dev-recreate-one service=<container>
```

On SELinux-enabled systems (Fedora), bind mounts use the `:z` option so containers can read project files.

## Dockerfile Changes

After changing a Dockerfile, rebuild the affected service:

```sh
make recreate-one service=api
make recreate-one service=front
```

For the dev stack:

```sh
make dev-recreate-one service=api
make dev-recreate-one service=front
```

## Database

The API container runs Prisma migrations on startup.

To run database setup manually and seed the database inside the API container:

```sh
make db-setup
```

To create a migration from local schema changes:

```sh
make migrate-generate name=your_migration_name
```

To apply pending migrations:

```sh
make migrate
```

To reset the dev database volumes and restart:

```sh
make migrate-reset
```

Adminer is available in dev mode at:

```text
http://localhost:8081
```

## IDE Workflow

You can work directly on the host files because dev mode bind-mounts the project into the containers.

For VS Code:

1. Install the Docker and Dev Containers extensions.
2. Start the dev stack with `make dev`.
3. Use `Dev Containers: Attach to Running Container...`.
4. Select either `transcendence_front` or `transcendence_api`.

## Notes

- The frontend production build is served by Next.js on port `8080`.
- The API production build starts from `dist/src/main.js`.
- Caddy owns public ports `80` and `443`.
- In production, frontend and API ports do not need to be exposed directly.
