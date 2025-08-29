from datetime import datetime
from email.message import EmailMessage
from email.utils import formataddr
from kitconcept.intranet import _
from plone import api
from plone.app.uuid.utils import uuidToObject
from plone.restapi.deserializer import json_body
from plone.restapi.interfaces import IExpandableElement
from plone.restapi.services import Service
from Products.CMFCore.utils import getToolByName
from zExceptions import BadRequest
from zope.component import getMultiAdapter
from zope.i18n import translate

import logging


logger = logging.getLogger("kitconcept.intranet")


class FeedbackPostContactForm(Service):
    """Submit the contact form and send an email depending of the category."""

    def reply(self):
        """Send an email to the responsible person and the person who submitted the feedback."""
        parent_object = self.context
        cc_email = api.portal.get_registry_record(
            "kitconcept.intranet.feedback_cc_email"
        )
        default_email = api.portal.get_registry_record(
            "kitconcept.intranet.default_feedback_email"
        )
        data = json_body(self.request)
        expander = getMultiAdapter(
            (parent_object, self.request),
            IExpandableElement,
            name="lcm",
        )
        expanded_data = expander(expand=True)
        responsible_person_uuid = (
            expanded_data.get("lcm", {})
            .get("responsible_person", {})
            .get("value", "no-person")
        )
        feedback_person_uuid = parent_object.feedback_person
        feedback_member = (
            uuidToObject(feedback_person_uuid) if feedback_person_uuid else None
        )
        responsible_member = (
            uuidToObject(responsible_person_uuid) if responsible_person_uuid else None
        )
        feedback_recipient_email = (
            getattr(feedback_member, "contact_email", None)
            or getattr(responsible_member, "contact_email", None)
            or ""
        )
        if not feedback_recipient_email:
            feedback_recipient_email = default_email
        data["feedback_recipient_email"] = feedback_recipient_email
        data["cc_email"] = cc_email
        validated = self._validate(data, parent_object)
        self._send_email(validated)
        self._send_confirmation_email(validated)
        return self.reply_no_content()

    def _translate(self, msg):
        return translate(msg, context=self.request)

    def _validate(self, data, parent_object):
        allowed_emails_domain = api.portal.get_registry_record(
            "kitconcept.intranet.allowed_email_domains"
        )
        reporter_email = data.get("email")
        name = data.get("name")
        feedback = data.get("feedback")
        feedback_recipient_email = data.get("feedback_recipient_email")

        if not feedback_recipient_email:
            raise BadRequest(
                self._translate(
                    _(
                        "No responsible person or default feedback email is configured. "
                        "Please contact the site administrator."
                    )
                )
            )

        if not feedback:
            raise BadRequest(self._translate(_("Please enter your feedback.")))

        if not reporter_email or (
            allowed_emails_domain
            and not any(
                reporter_email.endswith("@" + domain)
                for domain in allowed_emails_domain
            )
        ):
            raise BadRequest(
                self._translate(_("Please enter your organisational email address."))
            )

        return {
            "name": name,
            "reporter_email": reporter_email,
            "feedback": feedback,
            "cc_email": data.get("cc_email"),
            "date": datetime.now().strftime("%Y-%m-%d, %H:%M:%S"),
            "title": parent_object.title,
            "url": parent_object.absolute_url(),
            "feedback_recipient_email": data.get("feedback_recipient_email"),
            "user_agent": data.get("user_agent"),
            "window_width": data.get("window_width"),
            "window_height": data.get("window_height"),
        }

    def _send_email(self, data):
        mailhost = getToolByName(self.context, "MailHost")
        lang = api.portal.get_current_language()
        name = data["name"]
        if lang == "en":
            body = f"""Dear Intranet Editors and Page Owners,

We have received new feedback on the intranet that requires your attention and, where appropriate, action. The person who submitted the feedback has already received an automatic confirmation of receipt via email. The following data were sent to us:

**************************************************************************

Date: {data["date"]}
Content title: {data["title"]}
URL: {data["url"]}

**Feedback:**
{data["feedback"]}

**Metadata:**
User-Agent: {data["user_agent"]}
Window size: {data["window_width"]}px * {data["window_height"]}px

**Contact details:**
Name: {data["name"]}
Email: {data["reporter_email"]}

***********************************************************************************

Thank you for your attention.

Kind regards,
The intranet team
"""
            from_name = f"{name} via feedback contact form"
        else:
            body = f"""
Liebe Redakteur:innen,
liebe Seitenverantwortliche,

ein neues Feedback zum Intranet ist eingegangen und erfordert Ihre Prüfung sowie gegebenenfalls eine Bearbeitung. Der/die Einreicher:in hat bereits eine  automatische Eingangsbestätigung via E-Mail erhalten. Folgende Daten wurden uns übermittelt:

**************************************************************************

Datum: {data["date"]}
Titel des Inhalts: {data["title"]}
URL: {data["url"]}

**Feedback:**
{data["feedback"]}

**Metadaten:**
User-Agent: {data["user_agent"]}
Window size: {data["window_width"]}px * {data["window_height"]}px

**Kontaktdaten:**
Name (optional): {data["name"]}
E-Mail: {data["reporter_email"]}

***********************************************************************************

Vielen Dank für Ihre Unterstützung!

Viele Grüße
Ihr Intranet-Team
"""
            from_name = f"{name} über Kontaktformular"
        message = EmailMessage()
        message.set_content(body)
        message["Reply-To"] = data["reporter_email"]
        cc_email = data["cc_email"]
        if cc_email:
            message["Cc"] = cc_email
        from_email = api.portal.get_registry_record("plone.email_from_address")
        recipient_email = data["feedback_recipient_email"]
        subject = self._translate(_("Intranet feedback form: {title}")).format(
            title=data["title"]
        )
        if not recipient_email:
            raise BadRequest(
                self._translate(
                    _(
                        "This contact's email address is not known, "
                        "so the message cannot be delivered."
                    )
                )
            )

        try:
            mailhost.send(
                message.as_bytes(),
                recipient_email,
                formataddr((from_name, from_email)),
                subject=subject,
                charset="utf-8",
                immediate=True,
            )
        except Exception as e:
            logger.error(f"Unable to send email: {e!s}")
            raise Exception(self._translate(_("error.email")))

    def _send_confirmation_email(self, data):
        mailhost = getToolByName(self.context, "MailHost")
        from_email = api.portal.get_registry_record("plone.email_from_address")
        lang = api.portal.get_current_language()
        name = data["name"]
        if lang == "en":
            body = f"""

Hello {name or data["reporter_email"]},

Thank you for "your feedback on {data["title"]}" on the intranet. We value your feedback as it helps us to further improve the intranet.

What happens next?

Your feedback has been successfully recorded in our system. It will be carefully reviewed by the intranet editors responsible and processed as quickly as possible. If we have any questions about your feedback, we will email you directly.

If you have any technical questions, please contact {from_email}.

Kind regards,
The intranet team

*****************************************************

You provided us with the following feedback:
{data["feedback"]}
"""
            from_name = f"{name} via feedback contact form"
        else:
            body = f"""
Hallo {name or data["reporter_email"]},

vielen Dank für "Ihr Feedback zu {data["title"]}" in unserem Intranet. Ihre Rückmeldung ist für uns wertvoll, da sie uns dabei unterstützt, das Intranet weiter zu verbessern.

Wie geht es jetzt weiter?

Ihr Feedback wurde erfolgreich in unser System aufgenommen. Es wird von den zuständigen Intranet-Redakteur:innen sorgfältig geprüft und möglichst schnell bearbeitet. Sollten wir Rückfragen zu Ihrem Feedback haben, setzen wir uns direkt per E-Mail mit Ihnen in Verbindung.

Für technische Fragen wenden Sie sich gerne an {from_email}.

Mit freundlichen Grüßen
Ihr Intranet-Team

*****************************************************

Das haben Sie uns als Feedback eingereicht:
{data["feedback"]}
"""
            from_name = f"{name} über Kontaktformular"
        message = EmailMessage()
        message.set_content(body)
        message["Reply-To"] = data["feedback_recipient_email"]
        recipient_email = data["reporter_email"]
        subject = self._translate(
            _("Your feedback on our intranet content: {title}")
        ).format(title=data["title"])
        try:
            mailhost.send(
                message.as_bytes(),
                recipient_email,
                formataddr((from_name, from_email)),
                subject=subject,
                charset="utf-8",
                immediate=True,
            )
        except Exception as e:
            logger.error(f"Unable to send email: {e!s}")
            raise Exception(self._translate(_("error.email")))
