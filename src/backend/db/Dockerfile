FROM postgres:18-alpine3.22

RUN apk update && apk add --no-cache envsubst

COPY sql/*.sql /docker-entrypoint-initdb.d/

RUN cat seed.sql | envsubst > seed.sql; \
    cat seed_values.sql | envsubst > seed_values.sql
