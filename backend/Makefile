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

# Python checks
UV?=uv
JQ?=jq

# installed?
ifeq (, $(shell which $(UV) ))
  $(error "UV=$(UV) not found in $(PATH)")
endif

ifeq (, $(shell which $(JQ) ))
  $(error "JQ=$(JQ) not found in $(PATH)")
endif

REPOSITORY_SETTINGS := $(shell uvx repoplone settings dump)

# Every setting below is derived from this payload, so an empty result
# would silently expand to empty image names and paths.
ifeq (, $(REPOSITORY_SETTINGS))
  $(error "'uvx repoplone settings dump' returned no settings")
endif

IMAGE_NAME_PREFIX := $(shell echo '$(REPOSITORY_SETTINGS)' | jq -r '.container_images_prefix')
IMAGE_NAME_SEPARATOR := -
IMAGE_NAME_PREFIX_WITH_SEPARATOR := $(IMAGE_NAME_PREFIX)$(IMAGE_NAME_SEPARATOR)

IMAGE_TAG=latest
IMAGE_NAME=$(IMAGE_NAME_PREFIX_WITH_SEPARATOR)backend:$(IMAGE_TAG)

PACKAGE_NAME := $(shell echo '$(REPOSITORY_SETTINGS)' | jq -r '.backend.name')

PLONE_SITE_ID=Plone
BACKEND_FOLDER=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
PYTHON_VERSION := $(shell echo '$(REPOSITORY_SETTINGS)' | jq -r '.backend.python_version')
KC_VERSION := $(shell echo '$(REPOSITORY_SETTINGS)' | jq -r '.backend.base_package_version')
EXAMPLE_CONTENT_FOLDER := $(shell echo '$(REPOSITORY_SETTINGS)' | jq -r '.backend.code_path')/distributions/intranet/content

## AI test corpus (see the README in $(AI_CONTENT_FOLDER))
AI_CONTENT_FOLDER=${BACKEND_FOLDER}/example_content/ai-content

VENV_FOLDER=$(BACKEND_FOLDER)/.venv
export VIRTUAL_ENV=$(VENV_FOLDER)
BIN_FOLDER=$(VENV_FOLDER)/bin

SEED=$(shell date +'%Y%m%d-%H%M%S')

# Environment variables to be exported
export ALLOWED_DISTRIBUTIONS := kitconcept-intranet
export PYTHONWARNINGS := ignore
export DOCKER_BUILDKIT := 1
## Enable Printing MailHost by default, unless the environment variable is set to False
export ENABLE_PRINTING_MAILHOST ?= True


all: build

# Add the following 'help' target to your Makefile
# And add help text after each target name starting with '\#\#'
.PHONY: help
help: ## This help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.PHONY: debug-settings
debug-settings:  ## Debug settings
	@echo "Virtual Environment: $(VENV_FOLDER)"
	@echo "PYTHON_VERSION: $(PYTHON_VERSION)"
	@echo "KC_VERSION: $(KC_VERSION)"
	@echo "PACKAGE_NAME: $(PACKAGE_NAME)"
	@echo "EXAMPLE_CONTENT_FOLDER: $(EXAMPLE_CONTENT_FOLDER)"
	@echo "IMAGE_NAME: $(IMAGE_NAME)"

instance/etc/zope.ini instance/etc/zope.conf: instance.yaml ## Create instance configuration
	@echo "$(GREEN)==> Create instance configuration$(RESET)"
	if [[ -s instance-local.yaml ]]; then \
		echo ">>> Using instance-local.yaml"; \
		uvx cookiecutter -f --no-input --config-file instance-local.yaml gh:plone/cookiecutter-zope-instance; \
	else \
		uvx cookiecutter -f --no-input --config-file instance.yaml gh:plone/cookiecutter-zope-instance; \
	fi

.PHONY: config
config: instance/etc/zope.ini

.PHONY: sync
sync: ## Sync project dependencies
	@echo "$(GREEN)==> Sync project dependencies$(RESET)"
	@uv sync

.PHONY: install
install: sync config ## Install Plone and dependencies

$(VENV_FOLDER): sync ## Install Plone and dependencies

.PHONY: upgrade
upgrade: ## Force upgrade of kitconcept.voltolighttheme
	@echo "$(GREEN)==> Force update of dependencies$(RESET)"
	@uv sync --upgrade-package kitconcept.voltolighttheme

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


.PHONY: import-ai-content
import-ai-content: $(VENV_FOLDER) instance/etc/zope.conf ## Import the AI search test corpus into a fresh site
	@echo "$(GREEN)==> Import AI test corpus from $(AI_CONTENT_FOLDER) $(RESET)"
	@uv run plone-importer instance/etc/zope.conf $(PLONE_SITE_ID) $(AI_CONTENT_FOLDER)
	@uv run zconsole run instance/etc/zope.conf ./scripts/ai_content_demo_passwords.py

.PHONY: update-ai-content
update-ai-content: $(VENV_FOLDER) ## Export the AI search test corpus inside package
	@echo "$(GREEN)==> Export AI test corpus into $(AI_CONTENT_FOLDER) $(RESET)"
	if [ -d $(AI_CONTENT_FOLDER)/content ]; then rm -r $(AI_CONTENT_FOLDER)/content $(AI_CONTENT_FOLDER)/*.json ;fi
	@uv run plone-exporter instance/etc/zope.conf $(PLONE_SITE_ID) $(AI_CONTENT_FOLDER)
	@find $(AI_CONTENT_FOLDER)/content -type f -name 'data.json' -exec sed -i '' -e 's#http://nohost/Plone/#/#g' {} \;

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
	@docker build . --platform linux/amd64 -t $(IMAGE_NAME) --progress plain -f Dockerfile --build-arg KC_VERSION=$(KC_VERSION)
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-beispiele:$(IMAGE_TAG) $(RESET)"
	@docker build .  --pull=false --platform linux/amd64 -t $(IMAGE_NAME_PREFIX)-beispiele:$(IMAGE_TAG) -f Dockerfile.beispiele --build-arg IMAGE_TAG=$(IMAGE_TAG) --build-arg SEED=$(SEED)
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-acceptance:$(IMAGE_TAG) $(RESET)"
	@docker build .  --pull=false --platform linux/amd64 -t $(IMAGE_NAME_PREFIX)-acceptance:$(IMAGE_TAG) -f Dockerfile.acceptance --build-arg IMAGE_TAG=$(IMAGE_TAG) --build-arg SEED=$(SEED)

# Solr
.PHONY: solr-activate-and-reindex
solr-activate-and-reindex: $(VENV_FOLDER) instance/etc/zope.conf ## Activate solr and reindex
	@uv run zconsole run instance/etc/zope.conf ./scripts/solr_activate_and_reindex.py

.PHONY: solr-activate-and-reindex-with-rag
solr-activate-and-reindex-with-rag: $(VENV_FOLDER) instance/etc/zope.conf ## Activate solr and RAG (AI search) and reindex
	@uv run zconsole run instance/etc/zope.conf ./scripts/solr_activate_and_reindex.py --rag-enable

.PHONY: solr-activate-and-reindex-with-rag-clear
solr-activate-and-reindex-with-rag-clear: $(VENV_FOLDER) instance/etc/zope.conf ## Activate solr and RAG (AI search) and reindex with clear
	@uv run zconsole run instance/etc/zope.conf ./scripts/solr_activate_and_reindex.py --rag-enable --clear

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
