---
myst:
  html_meta:
    description: "How to add and configure forms on intranet pages using the Form block."
    keywords: "form, form block, volto-form-block, contact form, survey, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-08
---

# Use the Form block

The Form block (provided by the `volto-form-block` integration) lets you build interactive forms on any intranet page without writing code. Common uses include contact forms, surveys, registration requests, and feedback forms.

## Prerequisites

- You have Editor or Manager access to the page.
- The `volto-form-block` add-on is enabled on your installation (contact your administrator if you are unsure).
- You have an email address to receive submissions.

## Adding the Form Block

1. Open the page in **edit mode**.
2. Click the **+** button to open the block chooser.
3. Search for **Form** and click it to insert the block.

## Configuring the Form

### Email Settings

Submissions are sent by email. Configure the recipient in the **Email** tab of the sidebar:

| Field | Description |
|-------|-------------|
| **Send to** | The email address that receives submissions. Can be a single address or a comma-separated list. |
| **Reply-to field** | Select a form field (typically an Email field) to use as the reply-to address |
| **Subject** | Email subject line. You can include field values using `{field_id}` placeholders. |
| **Message template** | Optional template text added before the submitted values |

:::{tip}
Use a shared mailbox (e.g. `helpdesk@example.com`) rather than a personal address so submissions are not lost if someone leaves the organisation.
:::

### Adding Fields

1. In the **Fields** tab of the sidebar, click **Add field**.
2. Choose a field type:

| Field type | Use for |
|------------|---------|
| **Text** | Short single-line input (names, subjects) |
| **Textarea** | Multi-line free text (messages, comments) |
| **Email** | Email address with format validation |
| **Number** | Numeric input |
| **Date** | Date picker |
| **Checkbox** | Single yes/no toggle |
| **Select** | Drop-down list of options |
| **Radio** | Single-choice from visible options |
| **File upload** | Allow respondents to attach a file |
| **Static text** | Non-interactive text or instructions within the form |

3. For each field, set:
   - **Label** – the visible field name
   - **Required** – whether the field must be filled in before submission
   - **Placeholder** – optional hint text inside the input
   - **Description** – optional help text below the field

4. Drag field rows to reorder them.

### Configuring Options (Select / Radio)

For **Select** and **Radio** fields, add the list of options:

1. Click **Add option** under the field.
2. Enter the option label and (optionally) a different value to store.
3. Repeat for each option.

### Submit Button

| Setting | Description |
|---------|-------------|
| **Button label** | Text on the submit button (default: "Submit") |
| **Success message** | Message shown to the user after successful submission |
| **Send copy to user** | If enabled, and an Email field is present, a copy of their submission is emailed to the respondent |

### CAPTCHA / Spam Protection

If your site has CAPTCHA configured, enable it in the **Advanced** tab to protect high-traffic forms from spam.

## Previewing and Testing the Form

1. Click **Save** on the page.
2. View the page and fill in the form with test data.
3. Click **Submit** and verify you receive the email.
4. Check that the success message appears.

:::{warning}
Always test forms after creating or editing them. Check both the success flow and the validation messages when required fields are left blank.
:::

## Viewing Submitted Data

Depending on your site configuration, form submissions may also be stored in the Plone database:

1. Navigate to the page containing the form.
2. Open the **Actions** menu and look for **Download submissions** or **View submissions**.
3. If this option is absent, submissions are sent by email only.

## Example: Simple Contact Form

1. Add a **Form** block.
2. Add a **Text** field: Label = "Your name", Required = Yes.
3. Add an **Email** field: Label = "Your email address", Required = Yes.
4. Add a **Select** field: Label = "Topic", options = "General enquiry", "Technical issue", "Feedback".
5. Add a **Textarea** field: Label = "Message", Required = Yes.
6. In the **Email** tab: Send to = `helpdesk@example.com`, Subject = `Intranet enquiry from {name}`.
7. Set **Reply-to field** to the Email field.
8. Set **Button label** to "Send message".
9. Set **Success message** to "Thank you. We will get back to you within two working days."
10. Click **Save** and test.

## See Also

- [Blocks configuration](/how-to-guides/settings/blocks-config)
- [How to Configure Feedback](/how-to-guides/feedback/configure-feedback)
