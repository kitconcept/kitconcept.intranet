### Defensive settings for make:
#     https://tech.davis-hansson.com/p/make/
SHELL:=bash
.ONESHELL:
.SHELLFLAGS:=-xeu -o pipefail -O inherit_errexit -c
.SILENT:
.DELETE_ON_ERROR:
MAKEFLAGS+=--warn-undefined-variables
MAKEFLAGS+=--no-builtin-rules

# We like colors
# From: https://coderwall.com/p/izxssa/colored-makefile-for-golang-projects
RED=`tput setaf 1`
GREEN=`tput setaf 2`
RESET=`tput sgr0`
YELLOW=`tput setaf 3`

PACKAGE_NAME=kitconcept.intranet

IMAGE_NAME_PREFIX=ghcr.io/kitconcept/kitconcept-intranet
IMAGE_TAG=latest

# Python checks
UV?=uv

# installed?
ifeq (, $(shell which $(UV) ))
  $(error "UV=$(UV) not found in $(PATH)")
endif

PLONE_SITE_ID=Plone
BACKEND_FOLDER=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
KC_VERSION=$(shell cat $(BACKEND_FOLDER)/version.txt)
EXAMPLE_CONTENT_FOLDER=${BACKEND_FOLDER}/src/kitconcept/intranet/distributions/intranet/content

VENV_FOLDER=$(BACKEND_FOLDER)/.venv
BIN_FOLDER=$(VENV_FOLDER)/bin

SEED=$(shell date +'%Y%m%d-%H%M%S')

# Environment variables to be exported
export ALLOWED_DISTRIBUTIONS := kitconcept-intranet
export PYTHONWARNINGS := ignore
export DOCKER_BUILDKIT := 1

all: build

# Add the following 'help' target to your Makefile
# And add help text after each target name starting with '\#\#'
.PHONY: help
help: ## This help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

instance/etc/zope.ini instance/etc/zope.conf: ## Create instance configuration
	@echo "$(GREEN)==> Create instance configuration$(RESET)"
	@uvx cookiecutter -f --no-input --config-file instance.yaml gh:plone/cookiecutter-zope-instance

.PHONY: config
config: instance/etc/zope.ini

.PHONY: sync
sync: ## Sync project dependencies
	@echo "$(GREEN)==> Sync project dependencies$(RESET)"
	@uv sync

.PHONY: install
install: sync config ## Install Plone and dependencies

$(VENV_FOLDER): sync ## Install Plone and dependencies

.PHONY: clean
clean: ## Clean environment
	@echo "$(RED)==> Cleaning environment and build$(RESET)"
	@rm -rf $(VENV_FOLDER) pyvenv.cfg .installed.cfg instance .venv .pytest_cache .ruff_cache constraints* requirements*

.PHONY: remove-data
remove-data: ## Remove all content
	@echo "$(RED)==> Removing all content$(RESET)"
	rm -rf $(VENV_FOLDER) instance/var instance/etc/zope.ini
	$(MAKE) config

# Instance management

.PHONY: start
start: $(VENV_FOLDER) instance/etc/zope.ini ## Start a Plone instance on localhost:8080
	@uv run runwsgi instance/etc/zope.ini

.PHONY: console
console: $(VENV_FOLDER) instance/etc/zope.conf ## Start a console into a Plone instance
	@uv run zconsole debug instance/etc/zope.conf

.PHONY: create-site
create-site: $(VENV_FOLDER) instance/etc/zope.ini ## Create a new site from scratch
	@uv run zconsole run instance/etc/zope.conf ./scripts/create_site.py

## Example Content
.PHONY: update-example-content
update-example-content: $(VENV_FOLDER) ## Export example content inside package
	@echo "$(GREEN)==> Export example content into $(EXAMPLE_CONTENT_FOLDER) $(RESET)"
	if [ -d $(EXAMPLE_CONTENT_FOLDER)/content ]; then rm -r $(EXAMPLE_CONTENT_FOLDER)/* ;fi
	@uv run plone-exporter instance/etc/zope.conf $(PLONE_SITE_ID) $(EXAMPLE_CONTENT_FOLDER)
	$(MAKE) cleanup-example-content

.PHONY: cleanup-example-content
cleanup-example-content: $(VENV_FOLDER) ## Remove invalid references to http://nohost/Plone
	@echo "$(GREEN)==> Remove invalid references to http://nohost/Plone $(RESET)"
	@find $(EXAMPLE_CONTENT_FOLDER)/content -type f -name 'data.json' -exec sed -i '' -e 's#http://nohost/Plone/#/#g' {} \;

# QA
.PHONY: lint
lint: ## Check and fix code base according to Plone standards
	@echo "$(GREEN)==> Lint codebase$(RESET)"
	@uvx ruff@latest check --fix --config $(BACKEND_FOLDER)/pyproject.toml
	@uvx pyroma@latest -d .
	@uvx check-python-versions@latest .
	@uvx zpretty@latest --check src

.PHONY: format
format: ## Check and fix code base according to Plone standards
	@echo "$(GREEN)==> Format codebase$(RESET)"
	@uvx ruff@latest check --select I --fix --config $(BACKEND_FOLDER)/pyproject.toml
	@uvx ruff@latest format --config $(BACKEND_FOLDER)/pyproject.toml
	@uvx zpretty@latest -i src

# i18n
.PHONY: i18n
i18n: $(VENV_FOLDER) ## Update locales
	@echo "$(GREEN)==> Updating locales$(RESET)"
	@uv run python -m kitconcept.intranet.locales

# Tests
.PHONY: test
test: $(VENV_FOLDER) ## run tests
	@uv run pytest $(filter-out $@ --,$(MAKECMDGOALS))

.PHONY: test-coverage
test-coverage: $(VENV_FOLDER) ## run tests with coverage
	@uv run pytest --cov=kitconcept.intranet --cov-report term-missing

# Build Docker images
.PHONY: build-image
build-image:  ## Build Docker Images
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-backend:$(IMAGE_TAG) $(RESET)"
	@docker build . --platform linux/amd64 -t $(IMAGE_NAME_PREFIX)-backend:$(IMAGE_TAG) --progress plain -f Dockerfile --build-arg KC_VERSION=$(KC_VERSION)
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-beispiele:$(IMAGE_TAG) $(RESET)"
	@docker build .  --pull=false --platform linux/amd64 -t $(IMAGE_NAME_PREFIX)-beispiele:$(IMAGE_TAG) -f Dockerfile.beispiele --build-arg IMAGE_TAG=$(IMAGE_TAG) --build-arg SEED=$(SEED)
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-acceptance:$(IMAGE_TAG) $(RESET)"
	@docker build .  --pull=false --platform linux/amd64 -t $(IMAGE_NAME_PREFIX)-acceptance:$(IMAGE_TAG) -f Dockerfile.acceptance --build-arg IMAGE_TAG=$(IMAGE_TAG) --build-arg SEED=$(SEED)

# Solr
.PHONY: solr-activate-and-reindex
solr-activate-and-reindex: $(VENV_FOLDER) instance/etc/zope.conf ## Activate solr and reindex
	@uv run zconsole run instance/etc/zope.conf ./scripts/solr_activate_and_reindex.py

# Acceptance tests
.PHONY: acceptance-backend-start
acceptance-backend-start: ## Start backend acceptance server
	ZSERVER_HOST=0.0.0.0 ZSERVER_PORT=55001 LISTEN_PORT=55001 $(BIN_FOLDER)/robot-server kitconcept.intranet.testing.ROBOT_TESTING

.PHONY: acceptance-backend-start
acceptance-a11y-backend-start: ## Start backend a11y acceptance server
	ZSERVER_HOST=0.0.0.0 ZSERVER_PORT=55001 LISTEN_PORT=55001 $(BIN_FOLDER)/robot-server kitconcept.intranet.testing.A11Y_TESTING

.PHONY: acceptance-image-build
acceptance-image-build:  ## Build Docker Images
	@docker build .  --pull=false --platform linux/amd64 -t $(IMAGE_NAME_PREFIX)-acceptance:$(IMAGE_TAG) -f Dockerfile.acceptance --build-arg IMAGE_TAG=$(IMAGE_TAG) --build-arg SEED=$(SEED)
