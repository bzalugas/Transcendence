#!/bin/sh

set -e

until nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  sleep 2
done

echo "✅ PostgreSQL is ready"

bunx prisma migrate deploy

exec "$@"
