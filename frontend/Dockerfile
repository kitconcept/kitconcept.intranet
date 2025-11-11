# syntax=docker/dockerfile:1
ARG VOLTO_VERSION=undefined
FROM plone/frontend-builder:${VOLTO_VERSION} AS builder

COPY --chown=node packages/volto-intranet /app/packages/volto-intranet
COPY --chown=node volto.config.js /app/
COPY --chown=node pnpm-workspace.yaml /app/
COPY --chown=node package.json /app/package.json.temp
COPY --chown=node mrs.developer.json /app/mrs.developer.json
COPY --chown=node pnpm-lock.yaml /app/pnpm-lock.yaml

RUN --mount=type=cache,id=pnpm,target=/app/.pnpm-store,uid=1000 <<EOT
    set -e
    python3 -c "import json; orig_data = json.load(open('package.json.temp')); orig_deps = orig_data['dependencies']; orig_pnpm = orig_data['pnpm']; data = json.load(open('package.json')); data['dependencies'].update(orig_deps); data['pnpm'].update(orig_pnpm); json.dump(data, open('package.json', 'w'), indent=2)"
    rm package.json.temp
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
