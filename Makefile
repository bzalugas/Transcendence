COMPOSE			:= docker compose
COMPOSE_FILE	:= docker/compose.yaml
COMPOSE_DEV		:= docker/compose-dev.yaml
ENV_FILE		:= docker/.env
BACKEND_DIR     := backend/api
API_CONTAINER   := transcendence_api
DB_CONTAINER    := transcendence_db

all: up

# --- DEV PART ---
up:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up

up-d:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d

db-setup:
	docker exec $(API_CONTAINER) bunx prisma generate
	docker exec $(API_CONTAINER) bunx prisma migrate deploy
	docker exec $(API_CONTAINER) bunx prisma db seed

build:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) build

rebuild:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d --build 

logs:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) logs -f

down:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) down

down-v:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) down -v

stop:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) stop

rmi:
	docker rmi -f $$($(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV)  config --images) 2>/dev/null

start:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) start

restart:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) restart

re: clean build up


# --- PROD part ---

prod-up:
	$(COMPOSE) -f $(COMPOSE_FILE) up -d --build

prod-build:
	$(COMPOSE) -f $(COMPOSE_FILE)build

prod-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) logs

prod-down:
	$(COMPOSE) -f $(COMPOSE_FILE) down

prod-stop:
	$(COMPOSE) -f $(COMPOSE_FILE) stop

prod-rmi:
	docker rmi -f $$($(COMPOSE) -f $(COMPOSE_FILE) config --images) 2>/dev/null

prod-start:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) start

prod-restart:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) restart

#--- UTILS ---
# Generate prisma schema + create migration locally
migrate-generate:
	docker exec -it $(API_CONTAINER) bunx prisma migrate dev --name $(name)

# Apply pending migrations inside the container
migrate:
	docker exec $(API_CONTAINER) bunx prisma generate
	docker exec $(API_CONTAINER) bunx exec prisma migrate deploy

# Reset DB and restart fresh
migrate-reset: down-v
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d

clean: down-v rmi
	docker volume prune -f

.PHONY: all build build-prod dev prod up up-d logs down down-v stop rmi start restart re
