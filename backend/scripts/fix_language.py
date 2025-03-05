"""
Sets the language of existing content to the default language of the site.
Run it after changing the default language of the site.
This script is not intended to be run on Multilingual sites.

./.venv/bin/zconsole run instance/etc/zope.conf scripts/fix_language.py

"""

from plone import api
from zope.component.hooks import setSite

import transaction


portal = app.Plone  # noqa: F821
setSite(portal)


def main(app):
    pl = api.portal.get_tool("portal_languages")

    default_language = pl.getDefaultLanguage()

    with api.env.adopt_user(username="admin"):
        brains = api.content.find(
            path={"query": "/Plone"},
        )

        print(f"Processing a total of {len(brains)} objects")

        n = 0
        for brain in brains:
            try:
                obj = brain.getObject()
                if obj.language != default_language:
                    print(
                        f"Detected missing or wrong lang field to object, should be {default_language}: {obj.absolute_url()}"  # noqa:E501
                    )
                    obj.language = default_language
            except Exception:
                print(f"Error setting language in object: {brain.getPath()}")

            if n % 100 == 0:
                transaction.commit()
                print(f"{n} items processed.")

            n = n + 1

    # commit
    transaction.commit()
    app._p_jar.sync()


if "app" in locals():
    main(app)  # noqa: F821
