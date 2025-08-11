from kitconcept.intranet import logger
from plone import api
from plone.namedfile.file import NamedBlobImage
from Products.CMFPlone.Portal import PloneSite
from typing import Any

import codecs


def update_registry(data: dict[str, Any]) -> None:
    """Update Plone registry with provided data."""
    for key, value in data.items():
        api.portal.set_registry_record(key, value)
        logger.info(f"Updated registry record: {key}")


def convert_data_uri_to_image(raw_data: str) -> NamedBlobImage:
    """Convert data-uri format to a NamedBlobImage."""
    headers, body = raw_data.split("base64,")
    filename: str = headers.split("name=")[1][:-1]
    data = codecs.decode(body.encode("utf-8"), "base64")
    return NamedBlobImage(data=data, filename=filename)


def set_site_logo(raw_logo: str, portal: PloneSite) -> None:
    """Create an Image object from a data URI and set it as the site logo."""
    image = convert_data_uri_to_image(raw_logo)
    portal.logo = image
    logger.info(f"Set logo for {portal.id} with data provided via form.")
