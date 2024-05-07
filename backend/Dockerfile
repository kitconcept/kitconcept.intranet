# syntax=docker/dockerfile:1
ARG PLONE_VERSION=6
FROM plone/server-builder:${PLONE_VERSION} as builder

WORKDIR /app

# Add local code
COPY . src/kitconcept.intranet

# Install local requirements and pre-compile mo files
RUN <<EOT
    set -e
    mv src/kitconcept.intranet/requirements-docker.txt ./requirements.txt
    bin/pip install -r requirements.txt
    bin/python /compile_mo.py
    rm -Rf src/ /compile_mo.py compile_mo.log
EOT

FROM plone/server-prod-config:${PLONE_VERSION}

LABEL maintainer="kitconcept GmbH <info@kitconcept.com>" \
      org.label-schema.name="ghcr.io/kitconcept/intranet" \
      org.label-schema.description="A Plone distribution for Intranets with Plone. Created by kitconcept." \
      org.label-schema.vendor="kitconcept GmbH"

# Disable MO Compilation
ENV zope_i18n_compile_mo_files=
# Show only our distributions
ENV ALLOWED_DISTRIBUTIONS=intranet

COPY --from=builder /app /app

RUN <<EOT
    ln -s /data /app/var
EOT
