#!/bin/sh

psql -U "$POSTGRES_USER" -d "$DB_NAME" 01_schema.sql
psql -U "$POSTGRES_USER" -d "$DB_NAME" 02_data.sql
