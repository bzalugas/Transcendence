COMPOSE_FILE	:= docker/compose-prod.yaml
COMPOSE_DEV		:= docker/compose-dev.yaml
COMPOSE_DEV_OPT	:= --env-file docker/.env-dev
BACKEND_DIR     := src/backend/api
API_CONTAINER   := transcendence_api
DB_CONTAINER    := transcendence_db

all: up # change after to run the production version

build:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) build

build-prod:
	docker compose -f $(COMPOSE_FILE) build

dev:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) up --build -d

prod: build-prod
	docker compose -f $(COMPOSE_FILE) up -d

up:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) up -d

down:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) down

down-v:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) down -v

stop:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) stop

rmi:
	docker rmi -f $$(docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) config --images) 2>/dev/null

start:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) start

restart:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) restart

# Generate Better Auth schema + create migration locally
migrate-generate:
	docker exec -it $(API_CONTAINER) ./node_modules/.bin/prisma migrate dev --name better_auth_schema

# Apply pending migrations inside the container
migrate:
	docker exec -it $(API_CONTAINER) npm exec prisma migrate deploy

# Reset DB and restart fresh
migrate-reset: down-v
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) up -d

clean: down-v rmi
	docker volume prune -f

re: clean build up

.PHONY: all build build-prod dev prod up down down-v stop rmi start restartp
