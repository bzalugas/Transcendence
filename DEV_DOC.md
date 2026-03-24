*How to set up development environment on this project ?*
# Prerequisites

- docker (server & client)
- docker compose
- Make

# Work with the development infrastructure

## Run the dev mode

First of all, you need to create the `src/.env-dev` file with the needed env variables (**listed in src/.env_template**). For the moment, we use POSTGRES_DB but it may change.

Then, just run `make` in the root directory in order to run all services and start develop, debug, etc.

The sources are bind mounted, so that means you can **edit files locally** and the modifications will instantly take effect in the container.

**Be carefull**: it's possible that you develop some code based on the languages versions you have locally. If that's the case, always update the corresponding versions in the docker container (via Dockerfile).

If you want to be able to develop wihtout installing locally the dependencies, see the **next section**.

*Note on dev mode*: In dev mode, the ports of the api and db containers are exposed to the host in order to access them to debug. That will not be the case with the production mode.

### API container
API container is available on the port 3000. (Will not be avaiblable after).

### DB container
Postgres listen on port **5433** on host and **5432** on container;

### Front container
Front container is available on port 8080.

## Stop the containers

Use `make down` to stop and delete the containers. Use `make clean` to delete the anonymous volumes created by the bind mounts.

## Handling Dockerfiles changes

When updating a Dockerfile, run `make re` or `make build` then `make up` in order to build again the corresponding images before running containers.


# How to work with an IDE

Since the aim of this infrastructure is to harmonize all the dependencies between all the group members, you don't *need* to install locally the different libraries, programing languages, etc.

To avoid mistakes, it would be better to develop directly with the versions inside the container. In order to do this, depending on your IDE, it is possible to start a new dev envrionment directly connected to a container.

Of course, you can also synchronize your local versions with the container's ones and develop locally, but be careful!

## For VS Code

1. Add the `Docker` and `Dev Containers` extensions (both from Microsoft) to VS Code.
2. Run the command `dev containers: attach to running containers...`
3. Select the container you want to develop in.

**That's it!** You can then build and run the containers with the extensions but the best solution is to use the Makefile.

# Develop the database

In the `src/backend/db` folder, you can update the `init.d/01_schema.sql` and `init.d/02_data.sql` in order to create the database and insert values into it at the container runtime.

The service `adminer` is available on localhost at port `8081`. You can connect to the database from there or from terminal connecting to the port `5433` with `psql` on host.
