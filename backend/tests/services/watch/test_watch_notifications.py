from kitconcept.intranet.behaviors.watchers import IWatchers
from kitconcept.intranet.notifications import notifications_paused
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

    def test_no_mail_for_item_deleted_in_same_transaction(self):
        self.watch(self.doc, "alice")
        with api.env.adopt_user("bob"):
            notify(ObjectModifiedEvent(self.doc))
        with api.env.adopt_user(SITE_OWNER_NAME):
            api.content.delete(self.doc)
        transaction.commit()
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


class TestPausedNotifications:
    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, mails, watch):
        self.doc = functional_portal.doc1
        self.mails = mails
        watch(self.doc, "alice")

    def _modify(self):
        with api.env.adopt_user("bob"):
            notify(ObjectModifiedEvent(self.doc))

    def test_no_mail_for_changes_in_the_block(self):
        with notifications_paused():
            self._modify()
        # Scripts usually commit after the block.
        transaction.commit()
        assert self.mails == []

    def test_mail_for_changes_after_the_block(self):
        with notifications_paused():
            self._modify()
        self._modify()
        transaction.commit()
        assert len(self.mails) == 1

    def test_nested_blocks(self):
        with notifications_paused():
            with notifications_paused():
                pass
            self._modify()
        transaction.commit()
        assert self.mails == []


class TestMailHost:
    """The emails go through the MailHost's queue, not sent right away."""

    @pytest.fixture(autouse=True)
    def _setup(self, functional_portal, watch, monkeypatch):
        self.portal = functional_portal
        api.portal.set_registry_record(
            "plone.email_from_address", "intranet@example.org"
        )
        transaction.commit()
        self.sent = []
        from Products.MailHost.MailHost import MailHost

        monkeypatch.setattr(
            MailHost,
            "_send",
            lambda _self, mfrom, mto, msg, immediate=False: self.sent.append((
                mto,
                immediate,
            )),
        )
        watch(self.portal.doc1, "alice")

    def test_queued_not_immediate(self):
        with api.env.adopt_user("bob"):
            notify(ObjectModifiedEvent(self.portal.doc1))
        transaction.commit()
        assert self.sent == [(["alice@example.org"], False)]


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

    def _checkout(self):
        from plone.app.iterate.interfaces import ICheckinCheckoutPolicy

        with api.env.adopt_user(SITE_OWNER_NAME):
            wc = ICheckinCheckoutPolicy(self.portal.doc1).checkout(self.portal)
        transaction.commit()
        return wc

    def _checkin(self, wc):
        from plone.app.iterate.interfaces import ICheckinCheckoutPolicy

        with api.env.adopt_user(SITE_OWNER_NAME):
            wc.title = "Doc 1 new version"
            notify(ObjectModifiedEvent(wc))
            baseline = ICheckinCheckoutPolicy(wc).checkin("New version")
        transaction.commit()
        return baseline

    def test_watch_during_checkout_is_kept(self):
        self.watch(self.portal.doc1, "alice")
        wc = self._checkout()
        self.watch(self.portal.doc1, "bob")
        baseline = self._checkin(wc)
        assert IWatchers(baseline).userids() == ["alice", "bob"]
        assert sorted(mail.recipient for mail in self.mails) == [
            "alice@example.org",
            "bob@example.org",
        ]
        catalog = api.portal.get_tool("portal_catalog")
        brains = catalog.unrestrictedSearchResults(watchers="bob")
        assert [brain.getId for brain in brains] == ["doc1"]

    def test_unwatch_during_checkout_is_kept(self):
        self.watch(self.portal.doc1, "alice", "bob")
        wc = self._checkout()
        IWatchers(self.portal.doc1).remove("bob")
        self.portal.doc1.reindexObject(idxs=["watchers"])
        transaction.commit()
        baseline = self._checkin(wc)
        assert IWatchers(baseline).userids() == ["alice"]
        assert [mail.recipient for mail in self.mails] == ["alice@example.org"]
