*How to set up development environment on this project ?*
# Prerequisites

- docker (server & client)
- Make

# Run the development infrastructure

For the moment, you just need to run `make` in the root directory in order to run all services and start develop, debug, etc. The sources are bind mounted, so that means you can edit files locally and the modifications will instantly take effect in the container. If you want to be able to develop wihtout installing locally the dependencies, see the **next section**.

# How to work with IDE

Since the aim of this infrastructure is to harmonize all the dependencies between all the group members, you don't *need* to install locally the different libraries, programing languages, etc.
**Be carefull**: it's possible that you develop some code based on the versions you have locally. If that's the case, always update the corresponding versions in the docker container (via Dockerfile).

To avoid mistakes, it would be better to develop directly with the versions inside the container. In order to do this, depending on your IDE, it is possible to start a new dev envrionment directly connected to a container.

## For VS Code

1. Add the `Docker` and `Dev Containers` extensions (both from Microsoft) to VS Code.
2. Run the command `dev containers: attach to running containers...`
3. Select the container you want to develop in.

**That's it!** You can then build and run the containers with the extensions but the best solution is to use the Makefile.
