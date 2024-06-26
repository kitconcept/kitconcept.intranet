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

PRE_COMMIT=pipx run --spec 'pre-commit==3.7.1' pre-commit

# Set distributions still in development
DISTRIBUTIONS="kitconcept-intranet"
ALLOWED_DISTRIBUTIONS="kitconcept-intranet"

IMAGE_NAME_PREFIX=ghcr.io/kitconcept/kitconcept.intranet
IMAGE_TAG=latest

# Python checks
PYTHON?=python3

# installed?
ifeq (, $(shell which $(PYTHON) ))
  $(error "PYTHON=$(PYTHON) not found in $(PATH)")
endif

# version ok?
PYTHON_VERSION_MIN=3.8
PYTHON_VERSION_OK=$(shell $(PYTHON) -c "import sys; print((int(sys.version_info[0]), int(sys.version_info[1])) >= tuple(map(int, '$(PYTHON_VERSION_MIN)'.split('.'))))")
ifeq ($(PYTHON_VERSION_OK),0)
  $(error "Need python $(PYTHON_VERSION) >= $(PYTHON_VERSION_MIN)")
endif


PLONE_SITE_ID=Plone
BACKEND_FOLDER=$(shell dirname $(realpath $(firstword $(MAKEFILE_LIST))))
ROOT_FOLDER=$(shell dirname $(BACKEND_FOLDER))
PLONE_VERSION=$(shell cat $(BACKEND_FOLDER)/version.txt)
EXAMPLE_CONTENT_FOLDER=$(BACKEND_FOLDER)/src/kitconcept/intranet/distributions/intranet/content

GIT_FOLDER=$(ROOT_FOLDER)/.git
VENV_FOLDER=$(BACKEND_FOLDER)/.venv
BIN_FOLDER=$(VENV_FOLDER)/bin

SEED=$(shell date +'%Y%m%d-%H%M%S')

all: build

# Add the following 'help' target to your Makefile
# And add help text after each target name starting with '\#\#'
.PHONY: help
help: ## This help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

$(BIN_FOLDER)/pip $(BIN_FOLDER)/tox $(BIN_FOLDER)/pipx $(BIN_FOLDER)/uv $(BIN_FOLDER)/mxdev:
	@echo "$(GREEN)==> Setup Virtual Env$(RESET)"
	$(PYTHON) -m venv $(VENV_FOLDER)
	$(BIN_FOLDER)/pip install -U "pip" "uv" "wheel" "pipx" "mxdev" "tox" "tox-uv"

instance/etc/zope.ini: $(BIN_FOLDER)/pip  ## Create instance configuration
	@echo "$(GREEN)==> Create instance configuration$(RESET)"
	$(BIN_FOLDER)/pipx run cookiecutter -f --no-input --config-file instance.yaml gh:plone/cookiecutter-zope-instance

.PHONY: config
config: instance/etc/zope.ini

.PHONY: build-dev
build-dev: config ## Install Plone packages
	@echo "$(GREEN)==> Setup Build$(RESET)"
	$(BIN_FOLDER)/mxdev -c mx.ini
	$(BIN_FOLDER)/uv pip install -r requirements-mxdev.txt --prerelease=allow

.PHONY: install
install: build-dev ## Install Plone

.PHONY: build
build: build-dev ## Install Plone

.PHONY: clean
clean: ## Clean environment
	@echo "$(RED)==> Backend: Cleaning environment and build$(RESET)"
	rm -rf $(VENV_FOLDER) pyvenv.cfg .installed.cfg instance .tox .venv .pytest_cache constraints-mxdev.txt requirements-mxdev.txt

.PHONY: start
start: ## Start a Plone instance on localhost:8080
	DEVELOP_DISTRIBUTIONS=$(DISTRIBUTIONS) ALLOWED_DISTRIBUTIONS=$(DISTRIBUTIONS) PYTHONWARNINGS=ignore $(BIN_FOLDER)/runwsgi instance/etc/zope.ini

.PHONY: console
console: instance/etc/zope.ini ## Start a console into a Plone instance
	DEVELOP_DISTRIBUTIONS=$(DISTRIBUTIONS) ALLOWED_DISTRIBUTIONS=$(DISTRIBUTIONS) PYTHONWARNINGS=ignore $(BIN_FOLDER)/zconsole debug instance/etc/zope.conf

.PHONY: create-site
create-site: instance/etc/zope.ini ## Create a new site from scratch
	DEVELOP_DISTRIBUTIONS=$(DISTRIBUTIONS) ALLOWED_DISTRIBUTIONS=$(DISTRIBUTIONS) PYTHONWARNINGS=ignore $(BIN_FOLDER)/zconsole run instance/etc/zope.conf ./scripts/create_site.py

# Example Content
.PHONY: update-example-content
update-example-content: $(BIN_FOLDER)/tox ## Export example content inside package
	@echo "$(GREEN)==> Export example content into $(EXAMPLE_CONTENT_FOLDER) $(RESET)"
	if [ -d $(EXAMPLE_CONTENT_FOLDER)/content ]; then rm -r $(EXAMPLE_CONTENT_FOLDER)/* ;fi
	DEVELOP_DISTRIBUTIONS=$(DISTRIBUTIONS) ALLOWED_DISTRIBUTIONS=$(DISTRIBUTIONS) $(BIN_FOLDER)/export-distribution instance/etc/zope.conf $(PLONE_SITE_ID) $(EXAMPLE_CONTENT_FOLDER)


# Reindex site
.PHONY: solr-reindex-site
solr-reindex-site: instance/etc/zope.ini ## Solr: Activate and reindex
	DEVELOP_DISTRIBUTIONS=$(DISTRIBUTIONS) ALLOWED_DISTRIBUTIONS=$(DISTRIBUTIONS) PYTHONWARNINGS=ignore $(BIN_FOLDER)/zconsole run instance/etc/zope.conf ./scripts/solr_activate_and_reindex.py

.PHONY: check
check: $(BIN_FOLDER)/tox ## Check and fix code base according to Plone standards
	@echo "$(GREEN)==> Format codebase$(RESET)"
	make -C $(ROOT_FOLDER) check

# i18n
$(BIN_FOLDER)/i18ndude: $(BIN_FOLDER)/pip
	@echo "$(GREEN)==> Install translation tools$(RESET)"
	$(BIN_FOLDER)/uv pip install i18ndude

.PHONY: i18n
i18n: $(BIN_FOLDER)/i18ndude ## Update locales
	@echo "$(GREEN)==> Updating locales$(RESET)"
	$(BIN_FOLDER)/update_locale

# Tests
.PHONY: test
test: $(BIN_FOLDER)/tox ## run tests
	$(BIN_FOLDER)/pytest tests/

.PHONY: test-coverage
test-coverage: $(BIN_FOLDER)/tox ## run tests with coverage
	$(BIN_FOLDER)/tox -e coverage

# Build Docker image
.PHONY: build-image
build-image:  ## Build Docker Images
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-backend:$(IMAGE_TAG) $(RESET)"
	@DOCKER_BUILDKIT=1 docker build . -t $(IMAGE_NAME_PREFIX)-backend:$(IMAGE_TAG) -f Dockerfile --build-arg PLONE_VERSION=$(PLONE_VERSION)
	@echo "$(GREEN)==> Building $(IMAGE_NAME_PREFIX)-beispiele:$(IMAGE_TAG) $(RESET)"
	@DOCKER_BUILDKIT=1 docker build .  --pull=false -t $(IMAGE_NAME_PREFIX)-beispiele:$(IMAGE_TAG) -f Dockerfile.beispiele --build-arg IMAGE_TAG=$(IMAGE_TAG) --build-arg SEED=$(SEED)
