COMPOSE_FILE	:= docker/compose-prod.yaml
COMPOSE_DEV		:= docker/compose-dev.yaml
COMPOSE_DEV_OPT	:= --env-file docker/.env-dev

all: up-d # change after to run the production version

build:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) build

build-prod:
	docker compose -f $(COMPOSE_FILE) build

dev:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) up --build -d

prod: build-prod
	docker compose -f $(COMPOSE_FILE) up -d

up:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) up

up-d:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) up -d

logs:
	docker compose -f $(COMPOSE_DEV) $(COMPOSE_DEV_OPT) logs

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

clean: down-v rmi
	docker volume prune -f

re: clean build up

.PHONY: all build build-prod dev prod up up-d logs down down-v stop rmi start restart
