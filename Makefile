### Defensive settings for make:
#     https://tech.davis-hansson.com/p/make/
SHELL:=bash
.ONESHELL:
.SHELLFLAGS:=-xeu -o pipefail -O inherit_errexit -c
.SILENT:
.DELETE_ON_ERROR:
MAKEFLAGS+=--warn-undefined-variables
MAKEFLAGS+=--no-builtin-rules

CURRENT_DIR:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))
GIT_FOLDER=$(CURRENT_DIR)/.git

PROJECT_NAME=kitconcept-intranet
STACK_FILE=docker-compose-dev.yml
STACK_FILE_DEV=docker-compose-dev.yml
STACK_FILE_CI=docker-compose-ci.yml
STACK_HOSTNAME=kitconcept-intranet.localhost

# Docker Compose Helpers
STACK_PROFILE := $(if $(filter undefined,$(origin COMPOSE_PROFILES)),dev,$(COMPOSE_PROFILES))
COMPOSE_DEV := docker compose -f $(STACK_FILE) --profile dev
COMPOSE_ACCEPTANCE := docker compose -f $(STACK_FILE) --profile acceptance
COMPOSE_A11y := docker compose -f $(STACK_FILE) --profile a11y
COMPOSE_CI := docker compose -f $(STACK_FILE) -f $(STACK_FILE_CI) --profile $(STACK_PROFILE)

# CI Test Command
CI_TEST_COMMAND := $(if $(filter a11y,$(STACK_PROFILE)),ci-acceptance-a11y-test,ci-acceptance-test)

# Versioning variables
VOLTO_VERSION = $(shell cat frontend/mrs.developer.json | python -c "import sys, json; print(json.load(sys.stdin)['core']['tag'])")
KC_VERSION=$(shell cat backend/version.txt)
IMAGE_TAG=latest

# Environment variables to be exported
export VOLTO_VERSION := $(VOLTO_VERSION)
export KC_VERSION := $(KC_VERSION)
export DOCKER_BUILDKIT := 1
export COMPOSE_BAKE := 1

# We like colors
# From: https://coderwall.com/p/izxssa/colored-makefile-for-golang-projects
RED=`tput setaf 1`
GREEN=`tput setaf 2`
RESET=`tput sgr0`
YELLOW=`tput setaf 3`

.PHONY: all
all: install

# Add the following 'help' target to your Makefile
# And add help text after each target name starting with '\#\#'
.PHONY: help
help: ## This help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

###########################################
# Frontend
###########################################
.PHONY: frontend-install
frontend-install:  ## Install React Frontend
	$(MAKE) -C "./frontend/" install

.PHONY: frontend-build
frontend-build:  ## Build React Frontend
	$(MAKE) -C "./frontend/" build

.PHONY: frontend-start
frontend-start:  ## Start React Frontend
	$(MAKE) -C "./frontend/" start

.PHONY: frontend-test
frontend-test:  ## Test frontend codebase
	@echo "Test frontend"
	$(MAKE) -C "./frontend/" test

###########################################
# Backend
###########################################
.PHONY: backend-install
backend-install:  ## Create virtualenv and install Plone
	$(MAKE) -C "./backend/" install
	$(MAKE) backend-create-site

.PHONY: backend-build
backend-build:  ## Build Backend
	$(MAKE) -C "./backend/" install

.PHONY: backend-create-site
backend-create-site: ## Create a Plone site with default content
	$(MAKE) -C "./backend/" create-site

.PHONY: backend-update-example-content
backend-update-example-content: ## Export example content inside package
	$(MAKE) -C "./backend/" update-example-content

.PHONY: backend-delete-and-create-site
backend-delete-and-create-site: ## Remove all content and create site
	$(MAKE) -C "./backend/" remove-data
	$(MAKE) -C "./backend/" create-site

.PHONY: backend-start
backend-start: ## Start Plone Backend
	$(MAKE) -C "./backend/" start

.PHONY: backend-test
backend-test:  ## Test backend codebase
	@echo "Test backend"
	$(MAKE) -C "./backend/" test

.PHONY: install
install:  ## Install
	@echo "Install Backend & Frontend"
	$(MAKE) backend-install
	$(MAKE) frontend-install

.PHONY: start
start:  ## Start
	@echo "Starting application"
	$(MAKE) backend-start
	$(MAKE) frontend-start

.PHONY: clean
clean:  ## Clean installation
	@echo "Clean installation"
	$(MAKE) -C "./backend/" clean
	$(MAKE) -C "./frontend/" clean

.PHONY: status
status:  ## Show status
	@echo "Show status"
	python3 ./dirty.py

.PHONY: list-frontend-packages
list-frontend-packages: ## List frontend packages and their tags from mrs.developer.json
	@python3 -c 'import json; f = open("frontend/mrs.developer.json"); data = json.load(f); f.close(); result = {v["package"]: v.get("tag", None) for v in data.values() if isinstance(v, dict) and "package" in v and "tag" in v}; print(json.dumps(result, indent=2))'

.PHONY: format
format:  ## Format codebase
	@echo "Format codebase"
	$(MAKE) -C "./backend/" format
	$(MAKE) -C "./frontend/" format

.PHONY: lint
lint:  ## Lint codebase
	@echo "Lint codebase"
	$(MAKE) -C "./backend/" lint
	$(MAKE) -C "./frontend/" lint

.PHONY: i18n
i18n:  ## Update locales
	@echo "Update locales"
	$(MAKE) -C "./backend/" i18n
	$(MAKE) -C "./frontend/" i18n

.PHONY: test
test:  backend-test frontend-test ## Test codebase

.PHONY: build-images
build-images:  ## Build docker images
	@echo "Build Images"
	$(MAKE) -C "./backend/" build-image
	$(MAKE) -C "./frontend/" build-image

## Docker stack
.PHONY: stack-start
stack-start:  ## Local Stack: Start Services
	@echo "Start local Docker stack"
	$(COMPOSE_DEV) up -d --build
	@echo "Now visit: http://kitconcept-intranet.localhost"

.PHONY: start-stack
stack-create-site:  ## Local Stack: Create a new site
	@echo "Create a new site in the local Docker stack"
	$(COMPOSE_DEV) exec backend ./docker-entrypoint.sh create-site

.PHONY: start-status
stack-status:  ## Local Stack: Check Status
	@echo "Check the status of the local Docker stack"
	$(COMPOSE_DEV) ps

.PHONY: stack-stop
stack-stop:  ##  Local Stack: Stop Services
	@echo "Stop local Docker stack"
	$(COMPOSE_DEV) stop

.PHONY: stack-rm
stack-rm:  ## Local Stack: Remove Services and Volumes
	@echo "Remove local Docker stack"
	$(COMPOSE_DEV) down
	@echo "Remove local volume data"
	@docker volume rm $(PROJECT_NAME)_vol-site-data

####################################################
## Acceptance
####################################################
.PHONY: acceptance-backend-dev-start
acceptance-backend-dev-start: ## Build Acceptance Servers
	@echo "Build acceptance backend"
	$(MAKE) -C "./backend/" acceptance-backend-start

.PHONY: acceptance-frontend-dev-start
acceptance-frontend-dev-start: ## Build Acceptance Servers
	@echo "Build acceptance backend"
	$(MAKE) -C "./frontend/" acceptance-frontend-dev-start

.PHONY: acceptance-test
acceptance-test: ## Start Acceptance tests in interactive mode
	@echo "Build acceptance backend"
	$(MAKE) -C "./frontend/" acceptance-test

## A11y tests
.PHONY: acceptance-a11y-backend-dev-start
acceptance-a11y-backend-dev-start: ## Start a11y acceptance backend in dev mode
	@echo "Start acceptance backend"
	$(MAKE) -C "./backend/" a11y-backend-start

.PHONY: acceptance-a11y-frontend-prod-start
acceptance-a11y-frontend-prod-start: ## Start a11y acceptance frontend in prod mode
	$(MAKE) -C "./frontend/" acceptance-a11y-frontend-prod-start

.PHONY: acceptance-a11y-test
acceptance-a11y-test: ## Start a11y Cypress in interactive mode
	$(MAKE) -C "./frontend/" acceptance-a11y-test

.PHONY: ci-acceptance-a11y-test
ci-acceptance-a11y-test: ## Run a11y cypress tests in headless mode for CI
	$(MAKE) -C "./frontend/" ci-acceptance-a11y-test

## A11y tests with Containers
.PHONY: acceptance-a11y-images-build
acceptance-a11y-images-build: ## Build A11y frontend/backend images
	@echo "Build acceptance a11y images build"
	$(COMPOSE_A11y) build

.PHONY: acceptance-a11y-containers-start
acceptance-a11y-containers-start: ## Start A11y containers
	@echo "Start acceptance a11y containers"
	$(COMPOSE_A11y) up -d

.PHONY: acceptance-a11y-containers-stop
acceptance-a11y-containers-stop: ## Stop A11y containers
	@echo "Stop acceptance a11y containers"
	$(COMPOSE_A11y) down

## Acceptance tests with Containers
.PHONY: acceptance-images-build
acceptance-images-build: ## Build Acceptance frontend/backend images
	@echo "Build acceptance images build"
	$(COMPOSE_ACCEPTANCE) build

.PHONY: acceptance-containers-start
acceptance-containers-start: ## Start Acceptance containers
	@echo "Start acceptance containers"
	$(COMPOSE_ACCEPTANCE) up -d

.PHONY: acceptance-containers-stop
acceptance-containers-stop: ## Stop Acceptance containers
	@echo "Stop acceptance containers"
	$(COMPOSE_ACCEPTANCE) down

## Acceptance / A11y tests in CI
.PHONY: ci-images-load
ci-images-load: ## Load container images in CI
	@echo "Load container images"
	$(COMPOSE_CI) pull

.PHONY: ci-containers-start
ci-containers-start: ## Start Acceptance containers
	@echo "Start containers"
	$(COMPOSE_CI) up

.PHONY: ci-test
ci-test: ## Run Acceptance tests in ci mode
	@echo "Run tests"
	$(MAKE) -C "./frontend/" $(CI_TEST_COMMAND)

.PHONY: ci-acceptance-test-complete
ci-a11y-test-complete: ## Simulate CI a11y test run
	@echo "Simulate CI a11y test run"
	$(MAKE) acceptance-a11y-containers-start
	@echo "- Waiting for backend and frontend to be ready"
	pnpx wait-on --httpTimeout 20000 http-get://localhost:8080/plone http://localhost:3000
	$(MAKE) -C "./frontend/" ci-acceptance-a11y-test
	$(MAKE) acceptance-a11y-containers-stop

.PHONY: ci-acceptance-test-complete
ci-acceptance-test-complete: ## Simulate CI acceptance test run
	@echo "Simulate CI acceptance test run"
	$(MAKE) acceptance-containers-start
	@echo "- Waiting for backend and frontend to be ready"
	pnpx wait-on --httpTimeout 20000 http-get://localhost:55001/plone http://localhost:3000
	$(MAKE) -C "./frontend/" ci-acceptance-test
	$(MAKE) acceptance-containers-stop
