# syntax=docker/dockerfile:1.9
ARG KC_VERSION
FROM ghcr.io/kitconcept/core-builder:${KC_VERSION:-latest} AS builder

# Move skeleton folder
RUN <<EOT
    mv /app /app_base
EOT

# Install dependencies
RUN --mount=type=cache,target=/root/.cache \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync \
        --locked \
        --no-dev \
        --no-group test \
        --group container \
        --no-install-project

COPY . /src
WORKDIR /src

# Install package
RUN --mount=type=cache,target=/root/.cache \
    uv sync \
        --locked \
        --no-dev \
        --no-group test \
        --group container \
        --no-editable

# Move skeleton files to /app
RUN <<EOT
    mv /app_base/* /app
    rm -Rf /app_base
    mv scripts/create_site.py /app/scripts/create_site.py
    mv scripts/default.json /app/scripts/default.json
EOT

# Compile translation files
RUN <<EOT
    /app/bin/python /compile_mo.py
EOT

FROM ghcr.io/kitconcept/core-prod:${KC_VERSION:-latest}

LABEL maintainer="kitconcept GmbH <info@kitconcept.com>" \
      org.label-schema.name="ghcr.io/kitconcept/kitconcept-intranet-backend" \
      org.label-schema.description="A Plone distribution for Intranets with Plone. Created by kitconcept." \
      org.label-schema.vendor="kitconcept GmbH"

ENV ALLOWED_DISTRIBUTIONS=kitconcept-intranet

# Copy the pre-built `/app` directory to the runtime container
# and change the ownership to user app and group app in one step.
COPY --from=builder --chown=500:500 /app /app

RUN <<EOT
    ln -s /data /app/var
    chown -R 500:500 /data
EOT