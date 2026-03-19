COMPOSE_FILE	:= src/compose-prod.yaml
COMPOSE_DEV		:= src/compose-dev.yaml

all: up # change after to run the production version

build:
	docker compose -f $(COMPOSE_DEV) build

build-prod:
	docker compose -f $(COMPOSE_FILE) build

dev: build
	docker compose -f $(COMPOSE_DEV) up -d

prod: build-prod
	docker compose -f $(COMPOSE_FILE) up -d

up:
	docker compose -f $(COMPOSE_DEV) up -d

down:
	docker compose -f $(COMPOSE_DEV) down

stop:
	docker compose -f $(COMPOSE_DEV) stop

start:
	docker compose -f $(COMPOSE_DEV) start

restart:
	docker compose -f $(COMPOSE_DEV) restart

clean: down

re: down build up

.PHONY: all build build-prod dev prod up down stop start restart
