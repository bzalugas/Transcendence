#!/bin/sh

set -e # Arrêter le script si une commande échoue

# export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"

until nc -z "${POSTGRES_HOST}" "${POSTGRES_PORT}"; do
  sleep 2
done

echo "✅ PostgreSQL is ready"
echo "DATABASE_URL=${DATABASE_URL}"   # debug line, remove in prod

bunx prisma migrate deploy

# Exécuter la commande passée en argument (CMD du Dockerfile)
exec "$@"
