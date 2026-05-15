COMPOSE			:= docker compose
COMPOSE_FILE	:= docker/compose.yaml
COMPOSE_DEV		:= docker/compose-dev.yaml
ENV_FILE		:= docker/.env
BACKEND_DIR     := backend/api
API_CONTAINER   := transcendence_api
DB_CONTAINER    := transcendence_db

all: up

# --- PROD PART ---
up:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d --build

up-d:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d

build:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) build

build-one:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) build $(service)

up-one:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d $(service)

recreate-one:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d --build --force-recreate $(service)

logs:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs

down:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down

down-v:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down -v

stop:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) stop

rmi:
	docker rmi -f $$($(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) config --images) 2>/dev/null

start:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) start

restart:
	$(COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart

re: clean build up

# --- DEV PART ---
dev: dev-up

dev-up:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up

dev-up-d:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d

db-setup:
	docker exec $(API_CONTAINER) bunx prisma generate
	docker exec $(API_CONTAINER) bunx prisma migrate deploy
	docker exec $(API_CONTAINER) bunx prisma db seed

dev-build:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) build

dev-rebuild:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d --build 

dev-build-one:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) build $(service)

dev-up-one:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d $(service)

dev-recreate-one:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d --build --force-recreate $(service)

dev-logs:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) logs -f

dev-down:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) down

dev-down-v:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) down -v

dev-stop:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) stop

dev-rmi:
	docker rmi -f $$($(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) config --images) 2>/dev/null

dev-start:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) start

dev-restart:
	$(COMPOSE) -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) restart

dev-re: dev-clean dev-build dev-up

dev-clean: dev-down-v dev-rmi
	docker volume prune -f



#--- UTILS ---
# Generate prisma schema + create migration locally
migrate-generate:
	docker exec -it $(API_CONTAINER) bunx prisma migrate dev --name $(name)

# Apply pending migrations inside the container
migrate:
	docker exec $(API_CONTAINER) bunx prisma generate
	docker exec $(API_CONTAINER) bunx exec prisma migrate deploy

# Reset DB and restart fresh
migrate-reset: dev-down-v
	docker compose -f $(COMPOSE_FILE) -f $(COMPOSE_DEV) --env-file $(ENV_FILE) up -d

clean: down-v rmi
	docker volume prune -f

.PHONY: all up up-d build build-one up-one recreate-one logs down down-v stop rmi start restart re \
	dev dev-up dev-up-d dev-build dev-rebuild dev-build-one dev-up-one dev-recreate-one dev-logs dev-down dev-down-v dev-stop dev-rmi dev-start dev-restart dev-re dev-clean
