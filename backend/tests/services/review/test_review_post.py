from datetime import date
from kitconcept.intranet.utils.calc_due_date import calc_due_date
from plone import api

import pytest
import transaction


@pytest.fixture(scope="class")
def portal(portal_class):
    yield portal_class


@pytest.fixture(scope="class")
def contents(portal):
    with api.env.adopt_roles(["Manager"]):
        doc = api.content.create(portal, type="Document", id="foobar")
        api.content.transition(obj=doc, transition="publish")
        api.user.create(email="jdoe@example.org", username="jdoe")
        transaction.commit()


class TestReviewPost:
    @pytest.fixture(autouse=True)
    def _setup(self, contents, api_manager_request, api_anon_request):
        self.api_session = api_manager_request
        self.anon_api_session = api_anon_request
        self.default_review_interval = api.portal.get_registry_record(
            "kitconcept.intranet.content_review_default_interval"
        )

    def test_response_not_reviewable(self):
        resp = self.api_session.post("/@review")
        assert resp.status_code == 404

    def test_response_no_action(self):
        resp = self.api_session.post("/foobar/@review")
        assert resp.status_code == 400

    def test_response_anonymous(self):
        resp = self.anon_api_session.post("/foobar/@review")
        assert resp.status_code == 401

    def test_response_unknown_action(self):
        resp = self.api_session.post("/foobar/@review/foobar")
        assert resp.status_code == 400

    def test_action_approve(self):
        doc = api.content.get("/foobar")
        doc.review_status = "Due"
        doc.review_due_date = date(2002, 12, 30)
        transaction.commit()

        resp = self.api_session.post("/foobar/@review/approve")
        assert resp.status_code == 200

        interval = doc.review_interval or self.default_review_interval
        resp = self.api_session.get("/foobar").json()
        assert resp["review_status"]["token"] == "Up-to-date"  # noqa: S105
        assert resp["review_due_date"] == calc_due_date(interval=interval).isoformat()
        assert resp["review_completed_date"] == date.today().isoformat()

    def test_action_delegate(self):
        comment = "Lorem Ipsum dolor sit amet"
        resp = self.api_session.post(
            "/foobar/@review/delegate",
            json={"assignee": "jdoe", "comment": comment},
        )
        assert resp.status_code == 200

        resp = self.api_session.get("/foobar").json()
        assert resp["review_assignee"]["token"] == "jdoe"  # noqa: S105
        assert resp["review_comment"] == comment

    def test_action_delegate_unknown_assignee(self):
        resp = self.api_session.post(
            "/foobar/@review/delegate",
            json={"assignee": "f.bar"},
        )
        assert resp.status_code == 400

    def test_action_postpone(self):
        doc = api.content.get("/foobar")
        due_date = calc_due_date(base_date=doc.review_due_date)
        comment = "Lorem Ipsum dolor sit amet"
        resp = self.api_session.post(
            "/foobar/@review/postpone",
            json={"due_date": due_date.isoformat(), "comment": comment},
        )
        assert resp.status_code == 200

        resp = self.api_session.get("/foobar").json()
        assert resp["review_due_date"] == due_date.isoformat()
        assert resp["review_comment"] == comment
