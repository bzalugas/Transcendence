FROM postgres:18-alpine3.22

# RUN apk update && apk add --no-cache envsubst

COPY init.d/*.sql docker-entrypoint-initdb.d/
