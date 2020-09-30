#!/usr/bin/make -f

include .env
export

# Start application in development mode
dev:
	docker-compose \
		up \
			--build

# Start application in production mode
prod:
	docker-compose \
		--file docker-compose.prod.yaml \
		up \
			--build
			--remove-orphans

# Stop running containers and clean all images
clean:
	docker-compose \
		down \
			--rmi local \
			--volumes \
			--remove-orphans

# Build image
build:
	docker \
		build \
			-t $(APP_NAME) \
			-t $(DOCKER_REPOSITORY) \
			.

# Push image to registry
push:
	docker \
		push \
			$(DOCKER_REPOSITORY)

# Enter inside running container
enter:
	docker-compose \
		exec \
			app \
				bash
