---
myst:
  html_meta:
    "description": "Run a self-contained demo of the kitconcept Intranet Distribution with Docker Compose."
    "property=og:description": "Run a self-contained demo of the kitconcept Intranet Distribution with Docker Compose."
    "property=og:title": "Run the demo stack with Docker Compose"
    "keywords": "docker compose, demo, stack, traefik, solr, tika, postgresql, environment variables"
doc_type: how-to
audience: developer
status: draft
last_updated: 2026-09-11
---

# Run the demo stack with Docker Compose

This guide shows you how to run a complete kitconcept Intranet on your own machine with a single `docker-compose.yml` file.

The stack serves a working intranet on port 80, and on its first start it creates a Plone site populated with example content and indexed in Solr.

:::{warning}
This stack is a demo, and it is not ready for production.
It ships with well-known passwords, terminates no {abbr}`TLS (Transport Layer Security)`, runs one replica of every service, declares no health checks or restart policies, and makes no backup of your data.
Do not expose it to an untrusted network, and do not use it as the basis of a production deployment.

Deploying this distribution in production is outside the scope of this guide.
:::

## Prerequisites

- Docker Engine 20.10 or later, with the Compose plugin.
- Around 4&nbsp;GB of free memory and 5&nbsp;GB of free disk space.
- Port 80 free on the host, or another port set through `STACK_PORT`.

## Download the compose file

Create an empty directory and download the compose file from the `main` branch.

```shell
mkdir kitconcept-intranet-demo
cd kitconcept-intranet-demo
curl -O https://raw.githubusercontent.com/kitconcept/kitconcept.intranet/main/docker-compose.yml
```

## Create a .env file

Every value the compose file reads from the environment has a default, so the stack runs without any configuration.
To change the defaults, write a `.env` file next to `docker-compose.yml`.
Docker Compose reads it automatically.

The following example lists every supported variable at its default value.
Delete the lines you do not want to change.

```shell
# Image tag used for both the frontend and the backend
RELEASE=3.0.0a4

# Host name and protocol the stack answers on
STACK_HOSTNAME=kitconcept-intranet.localhost
STACK_PROTOCOL=http

# Host port Traefik publishes
STACK_PORT=80

# PostgreSQL
DB_VERSION=18
DB_NAME=plone
DB_USER=plone
DB_PASSWORD=plone

# Supporting service image tags
SOLR_TAG=3.0.0a2
TIKA_TAG=3.2.3.0-full

# Content review reminders
BACKEND_CLM_ENABLED=false
BACKEND_CLM_CRONTAB=0 1 * * *
```

### What each variable does

| Variable | Default | Description |
|---|---|---|
| `RELEASE` | `3.0.0a4` | Tag of the `kitconcept-intranet-frontend` and `kitconcept-intranet-backend` images. Both services always use the same tag. |
| `STACK_HOSTNAME` | `kitconcept-intranet.localhost` | Host name Traefik routes on, and the host name the backend writes into generated URLs. Traefik serves the Zope management interface on the `admin.` subdomain of this name. |
| `STACK_PROTOCOL` | `http` | Protocol the backend writes into generated URLs. Set it to `https` only when a separate reverse proxy in front of the stack terminates TLS. |
| `STACK_PORT` | `80` | Host port Traefik publishes. Change it when port 80 is already taken, or to keep Traefik on a port that only your own web server reaches. Browsing the stack directly on a port other than 80 makes Plone generate links without the port, so use a non-default value only behind a reverse proxy that publishes `STACK_HOSTNAME` on the standard port. |
| `DB_VERSION` | `18` | Tag of the `postgres` image. Use 18 or later. Earlier major versions keep their data in a different path inside the container, and the stack's volume mount does not match it. |
| `DB_NAME` | `plone` | Name of the database RelStorage connects to. |
| `DB_USER` | `plone` | Database user. |
| `DB_PASSWORD` | `plone` | Database password. |
| `SOLR_TAG` | `3.0.0a2` | Tag of the `kitconcept/solr` image. |
| `TIKA_TAG` | `3.2.3.0-full` | Tag of the `apache/tika` image. Use a `-full` tag, because text extraction needs the complete set of parsers. |
| `BACKEND_CLM_ENABLED` | `false` | Set to `true` to let the scheduler run the {term}`CLM` review reminder job. |
| `BACKEND_CLM_CRONTAB` | `0 1 * * *` | Schedule for that job, as a cron expression. |

Do not set `COMPOSE_PROJECT_NAME`.
The compose file names the project itself, and the scheduler relies on that name to find the containers it manages.

## Start the stack

```shell
docker compose up -d
```

Follow the backend log to watch site creation.

```shell
docker compose logs -f backend
```

The first start takes several minutes.
The backend pulls its image, creates the database schema, creates the Plone site, imports the example content, and reindexes everything into Solr.
The site is ready once the log shows `Site Plone created!`, which the backend writes after the Solr reindex has finished.

:::{note}
kitconcept publishes the frontend, backend, and Solr images for `linux/amd64` only.
On an Apple Silicon or other ARM64 host they run under emulation, which makes the first start considerably slower.
:::

## Open the intranet

With the default host name, the stack answers on these addresses.

| Address | Serves |
|---|---|
| `http://kitconcept-intranet.localhost/` | The intranet, rendered by Volto |
| `http://kitconcept-intranet.localhost/++api++/` | `plone.restapi` |
| `http://kitconcept-intranet.localhost/ClassicUI/` | Plone Classic UI |
| `http://admin.kitconcept-intranet.localhost/` | Zope management interface |

Sign in with the user `admin` and the password `admin`.
The `ClassicUI` and `admin` addresses are additionally protected by HTTP basic authentication, which uses the same `admin` and `admin` pair.

Most operating systems resolve any name ending in `.localhost` to `127.0.0.1`.
If yours does not, add both names to `/etc/hosts`.

```text
127.0.0.1 kitconcept-intranet.localhost admin.kitconcept-intranet.localhost
```

## What the stack runs

| Service | Image | Role |
|---|---|---|
| `traefik` | `traefik:v3.7` | Edge router. Publishes port 80 and routes by host name and path. |
| `frontend` | `kitconcept-intranet-frontend` | Volto, server-side rendered. |
| `backend` | `kitconcept-intranet-backend` | Plone, listening on port 8080. |
| `db` | `postgres` | Stores the whole database, content and binary files alike, through RelStorage. |
| `solr` | `kitconcept/solr` | Search index. |
| `tika` | `apache/tika` | Extracts searchable text from uploaded files. |
| `scheduler` | `mcuadros/ofelia` | Runs the review reminder job on a schedule. |

Only `db` has a volume, so the single named volume `vol-db-data` holds all the intranet's data.

## Change the site created on the first start

The `backend` service sets the variables that drive site creation.
Edit its `environment:` block to change them, then recreate the stack with an empty database.

| Variable | Value in the compose file | Description |
|---|---|---|
| `SITE` | `Plone` | Path segment where the backend creates the site. Removing this variable stops the backend from creating a site at all. |
| `SITE_TITLE` | not set | Title of the site. Defaults to `Plone Intranet by kitconcept`. |
| `SITE_DESCRIPTION` | not set | Description of the site. |
| `SITE_AVAILABLE_LANGUAGES` | not set | Comma-separated list of language codes. Defaults to `de`. |
| `SITE_PORTAL_TIMEZONE` | not set | Time zone of the site. Defaults to `Europe/Berlin`. |
| `SITE_WORKFLOW` | not set | Set to `restricted` to require authentication for the whole site. Defaults to `public`. |
| `SITE_SETUP_SOLR` | `true` | Installs and configures the Solr integration. |
| `SOLR_ACTIVATE` | `true` | Activates Solr as the search backend after site creation, and reindexes the content into it. |
| `SOLR_RAG` | not set | Enables {doc}`AI-assisted answers </features/ai-assisted-answers>`, which also need an {abbr}`LLM (large language model)` service. The demo leaves the feature off. |

Site creation runs on every start of the `backend` container, but it stops as soon as it finds a site at that path.
Changing any of these variables therefore has no effect on a site that already exists.
To apply a change, remove the data and start over, as described in the next section.

:::{warning}
The backend reads `SOLR_ACTIVATE` and `SOLR_RAG` as flags, so any non-empty value switches them on.
Setting `SOLR_RAG=false` enables the feature rather than disabling it.
Remove the variable instead.
:::

## AI features are not available in the demo stack

The demo stack does not support {doc}`AI-assisted answers </features/ai-assisted-answers>` yet.

That feature needs two things the stack does not provide.
The registry record `kitconcept.solr.rag_enabled` has to be on, which is what `SOLR_RAG` sets during site creation.
The backend also has to reach an {abbr}`LLM (large language model)` service through `KITCONCEPT_SOLR_LLM_URL`, and the stack neither runs such a service nor sets that variable.

Because the endpoint is missing, the feature stays off even if you set `SOLR_RAG`.
Everything else about search works as usual: Solr is active, and it holds the whole index of your content.

## Stop, restart, and reset

Stop the stack and keep the data.

```shell
docker compose down
```

Start it again.
The site is already there, so this start is fast.

```shell
docker compose up -d
```

Remove the stack and its data.
The next start creates a fresh site with example content again.

```shell
docker compose down --volumes
```

## Serve the stack behind another web server

Traefik in this stack speaks plain HTTP on port 80 and terminates no TLS.
To publish the intranet over HTTPS, put your own web server in front of the stack and let it terminate TLS.

Configure it as follows.

1.  Proxy the requests your web server receives to Traefik.
    Traefik publishes the port `STACK_PORT` names, which is 80 unless you change it.
2.  Preserve the original `Host` header when proxying.
    Every Traefik router in the stack matches on `Host()`, so a rewritten header stops the request from reaching any service.
3.  Set `STACK_HOSTNAME` to the public host name your web server answers on.
4.  Set `STACK_PROTOCOL` to `https`.

Steps 3 and 4 matter beyond routing.
The backend builds them into the virtual host rewrite that Plone uses to generate links, so leaving `STACK_PROTOCOL` at `http` makes the site emit `http://` URLs behind your HTTPS front end.

The following `.env` file publishes the intranet as `https://intranet.example.com`, with Traefik reachable on host port 8080 for your web server to proxy to.

```shell
STACK_HOSTNAME=intranet.example.com
STACK_PROTOCOL=https
STACK_PORT=8080
```

Keep `STACK_HOSTNAME` free of a port, even when `STACK_PORT` is not 80.
Your web server publishes the public name on the standard HTTPS port, and that is the name Plone has to write into its links.

:::{important}
Bind Traefik's published port to a private interface, or keep it on an internal network that only your web server can reach.
The stack applies no access control of its own beyond the basic authentication on `/ClassicUI` and the `admin.` subdomain.
:::

## Troubleshooting

The backend container exited during the first start
:   The backend does not wait for PostgreSQL to accept connections.
    On a slow host it can start before the database is ready.
    Start it again with `docker compose up -d backend`.

The intranet returns a Traefik 404 page
:   The host name in the request does not match `STACK_HOSTNAME`.
    Check the value in your `.env` file, and confirm that the name resolves to `127.0.0.1`.

Search returns no results
:   Look for `Reindexing solr...` in the backend log to confirm that the indexing pass ran.
    To reindex on demand, refer to {doc}`reindex-content`.

```{seealso}
- {doc}`/developer/getting-started/installation` to work on the distribution from a source checkout.
- {doc}`configure-reminders-for-content` to run the review reminder job in a Docker Swarm cluster.
- {doc}`/features/search` for what Solr adds to the intranet.
```
