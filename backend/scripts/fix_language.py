"""
Sets the language of existing content to the default language of the site.
Run it after changing the default language of the site.
This script is not intended to be run on Multilingual sites.

./.venv/bin/zconsole run instance/etc/zope.conf scripts/fix_language.py

"""

from plone import api
from zope.component.hooks import setSite

import transaction


portal = app.Plone  # noqa
setSite(portal)


def main(app):
    pl = api.portal.get_tool("portal_languages")

    default_language = pl.getDefaultLanguage()

    with api.env.adopt_user(username="admin"):
        brains = api.content.find(
            path={"query": f"/Plone"},
        )

        print(f"Processing a total of {len(brains)} objects")

        n = 0
        for brain in brains:
            try:
                obj = brain.getObject()
                if obj.language != default_language:
                    print(
                        f"Detected missing or wrong lang field to object, should be {default_language}: {obj.absolute_url()}"
                    )
                    obj.language = default_language
            except:  # noqa
                print(f"Error setting language in object: {brain.getPath()}")

            if n % 100 == 0:
                transaction.commit()
                print("{0} items processed.".format(n))

            n = n + 1

    # commit
    transaction.commit()
    app._p_jar.sync()


if "app" in locals():
    main(app)  # noqa
