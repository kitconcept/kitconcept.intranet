# kitconcept Intranet 🚀

[![Built with Cookieplone](https://img.shields.io/badge/built%20with-Cookieplone-0083be.svg?logo=cookiecutter)](https://github.com/plone/cookiecutter-plone/)
[![Tests](https://github.com/kitconcept/kitconcept.intranet/actions/workflows/main.yml/badge.svg)](https://github.com/kitconcept/kitconcept.intranet/actions/workflows/main.yml)

A Plone distribution for Intranets with Plone. Created by kitconcept.

## Quick Start 🏁

### Prerequisites

- Docker (https://www.docker.com/)
- Git (https://git-scm.com/downloads)

### Set up local demo instance

- Clone repository with `git clone https://github.com/kitconcept/kitconcept.intranet.git`
- Change directory to "kitconcept.intranet" with `cd kitconcept.intranet`
- Start Docker containers with `docker-compose up`
- Open kitconcept.intranet in your browser by typing `http://kitconcept-intranet.localhost/` into your browser URL field

## Development

### Prerequisites ✅

Ensure you have the following installed:

- Python 3.12 🐍
- Node 22 🟩
- pnpm 🧶
- Docker 🐳
- UV (See [https://docs.astral.sh/uv/getting-started/installation/#standalone-installer])

### Installation 🔧

1. Clone the repository:

```shell
git clone git@github.com:kitconcept/kitconcept.intranet.git
cd kitconcept.intranet
```

2. Install both Backend and Frontend:

```shell
make install
```

### Fire Up the Servers 🔥

1. Create a new Plone site on your first run:

```shell
make backend-create-site
```

or create the site manually by visiting [http://localhost:8080/](http://localhost:8080/).

2. Start the Backend at [http://localhost:8080/](http://localhost:8080/):

```shell
make backend-start
```

3. In a new terminal, start the Frontend at [http://localhost:3000/](http://localhost:3000/):

```shell
make frontend-start
```

Voila! Your Plone site should be live and kicking! 🎉

### Manual site creation 🔥

Point your browser at [http://localhost:8080/](http://localhost:8080/) and you will be greated with the site creation page:

<img alt="first step" src="./docs/docs/_static/01-new-site.png" width="640" />

After selecting **kitconcept Intranet** you will see a form:

<img alt="first step" src="./docs/docs/_static/02-auth-internal.png" width="640" />

### Amend Example Content

First, make sure that you do not have the backend process running.

Delete existing site and all its content and re-create a new Plone site:

````
make backend-delete-and-create-site
````

Start the backend with:

````
make backend-start
````

and amend the content on the site.

Stop the backend by killing the `make backend-start` process (CTRL+C).

Export the content of the Plone site to your local repository (make sure the backend is stopped for this):

````
make backend-update-example-content
````

Show the diff in your local repository:

````
git diff
````

Commit your changes:

````
git add .
git checkout -b <MY_BRANCH>
git commit . -m"<MY_COMMIT_MESSAGE>"
git push
````

Go to [github.com/kitconcept/kitconcept.intranet](https://github.com/kitconcept/kitconcept.intranet/pulls) and click on the banner that shows your PR. Click on "Compare & pull request".

#### Authentication

Choosing **Keycloak** for user authentication will present configuration options:

<img alt="first step" src="./docs/docs/_static/03-auth-keycloak.png" width="300" />


Choosing **OIDC / OAuth2** for user authentication will present configuration options:

<img alt="first step" src="./docs/docs/_static/04-auth-oidc.png" width="300" />


Choosing **Google** for user authentication will present configuration options:

<img alt="first step" src="./docs/docs/_static/05-auth-google.png" width="300" />


Choosing **GitHub** for user authentication will present configuration options:

<img alt="first step" src="./docs/docs/_static/06-auth-github.png" width="300" />


### Local Stack Deployment 📦

Deploy a local `Docker Compose` environment that includes:

- Docker images for Backend and Frontend 🖼️
- A stack with a Traefik router and a Postgres database 🗃️
- Accessible at [http://kitconcept.intranet.localhost](http://kitconcept.intranet.localhost) 🌐

Execute the following:

```shell
make stack-start
make stack-create-site
```

And... you're all set! Your Plone site is up and running locally! 🚀

## Project Structure 🏗️

This monorepo consists of three distinct sections: `backend`, `frontend`, and `devops`.

- **backend**: Houses the API and Plone installation, utilizing pip instead of buildout, and includes a policy package named kitconcept.intranet.
- **frontend**: Contains the React (Volto) package.
- **devops**: Encompasses Docker Stack, Ansible playbooks, and Cache settings.

### Why This Structure? 🤔

- All necessary codebases to run the site are contained within the repo (excluding existing addons for Plone and React).
- Specific GitHub Workflows are triggered based on changes in each codebase (refer to .github/workflows).
- Simplifies the creation of Docker images for each codebase.
- Demonstrates Plone installation/setup without buildout.

## Code Quality Assurance 🧐

To automatically format your code and ensure it adheres to quality standards, execute:

```shell
make check
```

Linters can be run individually within the `backend` or `frontend` folders.

## Internationalization 🌐

Generate translation files for Plone and Volto with ease:

```shell
make i18n
```

## Credits and Acknowledgements 🙏

Crafted with care by **Generated using [Cookieplone (0.7.0)](https://github.com/plone/cookieplone) and [cookiecutter-plone (9937161)](https://github.com/plone/cookiecutter-plone/commit/993716123f0616eea9074ae4bd82eb3fcd48c4f1) on 2024-05-28 19:04:49.900739**. A special thanks to all contributors and supporters!
