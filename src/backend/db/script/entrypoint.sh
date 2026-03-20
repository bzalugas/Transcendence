#!/bin/sh

createdb -U "$POSTGRES_USER" "$DB_NAME"
psql -U "$POSTGRES_USER" -d "$DB_NAME" < transcendence_db.sql
psql -U "$POSTGRES_USER" "$DB_NAME" < db_dump.sql
