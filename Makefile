COMPOSE_FILE	:= src/compose.yaml

all: up

build:
	docker compose -f $(COMPOSE_FILE) build

up:
	docker compose -f $(COMPOSE_FILE) up -d

down:
	docker compose -f $(COMPOSE_FILE) down

stop:
	docker compose -f $(COMPOSE_FILE) stop

start:
	docker compose -f $(COMPOSE_FILE) start

restart:
	docker compose -f $(COMPOSE_FILE) restart

clean: down
	docker system prune -f -a --volumes

re: down build up

.PHONY: build up down stop start restart
