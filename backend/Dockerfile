# syntax=docker/dockerfile:1
ARG PLONE_VERSION=6.0.13
FROM plone/server-builder:${PLONE_VERSION} AS builder

WORKDIR /app


# Add local code
COPY scripts/ scripts/
COPY . src

# Install local requirements and pre-compile mo files
RUN <<EOT
    set -e
    bin/pip install mxdev uv hatch
    cd /app/src
    ../bin/hatch build
    ../bin/mxdev -c mx.ini
    ../bin/uv pip install dist/*.whl -c constraints-mxdev.txt
    ../bin/python /compile_mo.py
    cd /app
    rm -Rf /app/src
EOT

FROM plone/server-prod-config:${PLONE_VERSION}

LABEL maintainer="kitconcept GmbH <info@kitconcept.com>" \
      org.label-schema.name="ghcr.io/kitconcept/kitconcept-intranet-backend" \
      org.label-schema.description="A Plone distribution for Intranets with Plone. Created by kitconcept." \
      org.label-schema.vendor="kitconcept GmbH"

# Disable MO Compilation
ENV zope_i18n_compile_mo_files=

# Show only our distributions
ENV ALLOWED_DISTRIBUTIONS=kitconcept-intranet

# Increase Upload limit to 6MB
ENV ZOPE_FORM_MEMORY_LIMIT=6MB

# Copy /app from builder
COPY --from=builder /app /app

RUN <<EOT
    set -e
    ln -s /data /app/var
EOT
