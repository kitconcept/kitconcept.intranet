from kitconcept.intranet.behaviors.watchers import IWatchers
from plone import api
from plone.app.testing.interfaces import SITE_OWNER_NAME
from zope.event import notify
from zope.lifecycleevent import ObjectModifiedEvent

import pytest
import transaction


class TestWatchNotifications:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, user_request, mails, watch):
        self.portal = functional_portal
        self.bob = user_request("bob")
        self.mails = mails
        self.watch = watch
        self.doc = self.portal.doc1

    def _edit(self, session, path="/doc1", **data):
        data.setdefault("title", "Doc 1 changed")
        response = session.patch(path, json=data)
        assert response.status_code == 204, response.text

    def test_mail_to_watcher(self):
        self.watch(self.doc, "alice")
        self._edit(self.bob)
        assert [mail.recipient for mail in self.mails] == ["alice@example.org"]
        mail = self.mails[0]
        assert mail.subject == "Update to “Doc 1 changed”"
        assert "Hello Alice Watcher," in mail.body
        assert "Changed by: Bob Editor" in mail.body
        assert f"{self.doc.absolute_url()}/history" in mail.body
        assert "To stop watching, open the content" in mail.body

    def test_one_mail_per_watcher(self):
        self.watch(self.doc, "alice", "carol")
        self._edit(self.bob)
        assert sorted(mail.recipient for mail in self.mails) == [
            "alice@example.org",
            "carol@example.org",
        ]

    def test_change_note(self):
        self.watch(self.doc, "alice")
        self._edit(self.bob, changeNote="Fixed the opening hours")
        assert "Change note: Fixed the opening hours" in self.mails[0].body

    def test_no_mail_to_the_editor(self):
        self.watch(self.doc, "bob")
        self._edit(self.bob)
        assert self.mails == []

    def test_no_mail_without_watchers(self):
        self._edit(self.bob)
        assert self.mails == []

    def test_no_mail_for_private_content(self, user_request):
        self.watch(self.portal.private, "dora")
        self._edit(self.bob, path="/private")
        assert self.mails == []

    def test_no_mail_without_view_permission(self):
        self.watch(self.doc, "alice")
        self.doc.manage_permission("View", ["Manager", "Editor"], acquire=False)
        self.doc.reindexObjectSecurity()
        transaction.commit()
        self._edit(self.bob)
        assert self.mails == []

    def test_no_mail_when_disabled(self, disable_watching):
        self.watch(self.doc, "alice")
        self._edit(self.bob)
        assert self.mails == []

    def test_mail_on_publish(self):
        private = self.portal.private
        self.watch(private, "dora")
        with api.env.adopt_user(SITE_OWNER_NAME):
            api.content.transition(private, "publish")
        transaction.commit()
        assert [mail.recipient for mail in self.mails] == ["dora@example.org"]

    def test_several_events_send_one_mail(self):
        self.watch(self.doc, "alice")
        with api.env.adopt_user("bob"):
            notify(ObjectModifiedEvent(self.doc))
            notify(ObjectModifiedEvent(self.doc))
        transaction.commit()
        assert len(self.mails) == 1

    def test_no_mail_on_aborted_transaction(self):
        self.watch(self.doc, "alice")
        with api.env.adopt_user("bob"):
            notify(ObjectModifiedEvent(self.doc))
        transaction.abort()
        assert self.mails == []

    def test_no_mail_for_new_child(self):
        self.watch(self.doc, "alice")
        response = self.bob.post("/doc1", json={"@type": "Document", "title": "Child"})
        assert response.status_code == 201
        assert self.mails == []

    def test_german_mail(self):
        self.doc.language = "de"
        transaction.commit()
        self.watch(self.doc, "alice")
        self._edit(self.bob, title="Öffnungszeiten")
        mail = self.mails[0]
        assert mail.subject == "Änderung an „Öffnungszeiten“"
        assert "Hallo Alice Watcher," in mail.body
        assert "Geändert von: Bob Editor" in mail.body


class TestWatchersLifecycle:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, watch):
        self.portal = functional_portal
        self.watch = watch

    def test_copy_has_no_watchers(self):
        self.watch(self.portal.doc1, "alice")
        with api.env.adopt_user(SITE_OWNER_NAME):
            copy = api.content.copy(self.portal.doc1, self.portal, id="doc1-copy")
        assert IWatchers(copy).userids() == []
        assert IWatchers(self.portal.doc1).userids() == ["alice"]
        catalog = api.portal.get_tool("portal_catalog")
        brains = catalog.unrestrictedSearchResults(watchers="alice")
        assert [brain.getId for brain in brains] == ["doc1"]


class TestWorkingCopy:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, mails, watch):
        self.portal = functional_portal
        self.mails = mails
        self.watch = watch

    def test_checkout_and_checkin(self):
        from plone.app.iterate.interfaces import ICheckinCheckoutPolicy

        doc = self.portal.doc1
        self.watch(doc, "alice")
        with api.env.adopt_user(SITE_OWNER_NAME):
            wc = ICheckinCheckoutPolicy(doc).checkout(self.portal)
            transaction.commit()
            catalog = api.portal.get_tool("portal_catalog")
            brains = catalog.unrestrictedSearchResults(watchers="alice")
            assert [brain.getId for brain in brains] == ["doc1"]

            wc.title = "Doc 1 new version"
            notify(ObjectModifiedEvent(wc))
            transaction.commit()
            assert self.mails == []

            baseline = ICheckinCheckoutPolicy(wc).checkin("New opening hours")
            transaction.commit()

        assert IWatchers(baseline).userids() == ["alice"]
        assert len(self.mails) == 1
        assert self.mails[0].subject == "Update to “Doc 1 new version”"
        assert "Change note: New opening hours" in self.mails[0].body
