# syntax=docker/dockerfile:1
ARG VOLTO_VERSION=undefined
FROM plone/frontend-builder:${VOLTO_VERSION} AS builder

COPY --chown=node packages/kitconcept-intranet /app/packages/kitconcept-intranet
COPY --chown=node volto.config.js /app/
COPY --chown=node pnpm-workspace.yaml /app/
COPY --chown=node package.json /app/package.json
COPY --chown=node mrs.developer.json /app/mrs.developer.json
COPY --chown=node pnpm-lock.yaml /app/pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm,target=/app/.pnpm-store,uid=1000 <<EOT
    set -e
    make install
    pnpm build
    # This is necessary because the build is trying to recreate the node_modules folder
    # by telling it to CI=1 it will just recreate them
    CI=1 pnpm install --prod
EOT

FROM plone/frontend-prod-config:${VOLTO_VERSION}

LABEL maintainer="kitconcept GmbH <info@kitconcept.com>" \
      org.label-schema.name="kitconcept-intranet-frontend" \
      org.label-schema.description="kitconcept Intranet frontend image." \
      org.label-schema.vendor="kitconcept GmbH"

# Upgrades pnpm to the latest version globally
RUN corepack install -g pnpm

COPY --from=builder /app/ /app/

# Specifically install and uses the package manager configured in the local project
RUN corepack install
