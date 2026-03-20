COMPOSE_FILE	:= docker/compose-prod.yaml
COMPOSE_DEV		:= docker/compose-dev.yaml

all: up # change after to run the production version

build:
	docker compose -f $(COMPOSE_DEV) build

build-prod:
	docker compose -f $(COMPOSE_FILE) build

dev:
	docker compose -f $(COMPOSE_DEV) up --build -d

prod: build-prod
	docker compose -f $(COMPOSE_FILE) up -d

up:
	docker compose -f $(COMPOSE_DEV) up -d

down:
	docker compose -f $(COMPOSE_DEV) down

stop:
	docker compose -f $(COMPOSE_DEV) stop

rmi:
	docker rmi -f $$(docker compose -f $(COMPOSE_DEV) config --images) 2>/dev/null

start:
	docker compose -f $(COMPOSE_DEV) start

restart:
	docker compose -f $(COMPOSE_DEV) restart

clean: down rmi
	docker volume prune -f


re: down build up

.PHONY: all build build-prod dev prod up down stop rmi start restart
