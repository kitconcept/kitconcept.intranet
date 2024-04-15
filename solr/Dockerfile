# syntax=docker/dockerfile:1
FROM solr:8

LABEL maintainer="kitconcept, GmbH <info@kitconcept.com>" \
      org.label-schema.name="ghcr.io/kitconcept/solr" \
      org.label-schema.description="Solr 8 image with Plone default settings" \
      org.label-schema.vendor="kitconcept, GmbH"

# Copy default plone configuration for this image
COPY etc /plone-config
COPY bin/solr-update-core /opt/docker-solr/scripts
