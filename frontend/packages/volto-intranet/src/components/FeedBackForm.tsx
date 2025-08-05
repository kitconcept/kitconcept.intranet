import React, { useEffect, useState } from 'react';
import { useIntl, defineMessages } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import { getBaseUrl } from '@plone/volto/helpers/Url/Url';
import { useHistory, useLocation } from 'react-router-dom';
import { usePrevious } from '@plone/volto/helpers/Utils/usePrevious';
import { Toast } from '@plone/volto/components';
import { toast } from 'react-toastify';
import { submitFeedbackContactForm } from '../actions';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import { Form, Button, Container } from '@plone/components';
import {
  Label,
  TextArea,
  FieldError,
  Input,
  TextField,
} from 'react-aria-components';

const messages = defineMessages({
  name: {
    id: 'Name',
    defaultMessage: 'Name',
  },
  error: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  feedback: {
    id: 'Feedback',
    defaultMessage: 'Feedback',
  },
  url: {
    id: 'Subject page/URL',
    defaultMessage: 'Subject page/URL',
  },
  send: {
    id: 'Send feedback',
    defaultMessage: 'Send feedback',
  },
  cancel: {
    id: 'cancel',
    defaultMessage: 'cancel',
  },
  email: {
    id: 'Email',
    defaultMessage: 'Email',
  },
  success: {
    id: 'Success',
    defaultMessage: 'Success',
  },
  successContent: {
    id: 'Your feedback has been submitted successfully. You will receive a confirmation email shortly.',
    defaultMessage:
      'Your feedback has been submitted successfully. You will receive a confirmation email shortly.',
  },
  feedbackOn: {
    id: 'Feedback on:',
    defaultMessage: 'Feedback on:',
  },
  feedbackTo: {
    id: 'Feedback to:',
    defaultMessage: 'Feedback to:',
  },
  feedbackError: {
    id: 'Please fill in the Feedback field',
    defaultMessage: 'Please fill in the Feedback field',
  },
  emailError: {
    id: 'Please enter your FZJ email address.',
    defaultMessage: 'Please enter your FZJ email address.',
  },
  emailHelpText: {
    id: 'Only internal e-mail addresses ending with @fz-juelich.de are permitted..',
    defaultMessage:
      'Only internal e-mail addresses ending with @fz-juelich.de are permitted..',
  },
});

let requiredField: string[] = ['email', 'feedback'];

const englishPlaceholder = `Please provide as much detail as possible about the issue, such as:
- Which page or which area of the intranet is concerned?
- What exactly is the issue?
- Do you have a suggestion for improvement?
- If an error occurs: what were you doing before the error occurred?
`;

const germanPlaceholder = `Machen Sie bitte möglichst genaue Angaben zu Ihrem Problem, etwa:
- Welche Seite oder welcher Bereich des Intranets ist betroffen?
- Was genau ist das Problem?
- Haben Sie eine Verbesserungsidee?
- Falls ein Fehler auftritt: Welche Schritte haben Sie unternommen, bis der Fehler auftrat?
`;

interface FormData {
  feedback: string;
  email: string;
  name: string;
  [key: string]: string;
}

const FeedBackForm = () => {
  const [form, setForm] = useState<FormData>({
    feedback: '',
    email: '',
    name: '',
  });
  const [metadata, setMetadata] = useState({});
  const [emailError, setEmailError] = useState(false);
  const [emailErrorSubmit, setEmailErrorSubmit] = useState(false);

  const [feedbackError, setFeedbackError] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const { locale } = useIntl();
  let PageURl = getBaseUrl(useLocation().pathname);

  const dispatch = useDispatch();
  const { loading, loaded, error } = useSelector(
    (state: any) => state.feedbackContactForm,
  );

  const isLoading = usePrevious(loading);

  const content = useSelector((state: any) => state.content.data);

  const responsiblePersonUUID =
    content?.['@components']?.lcm?.responsible_person?.value;

  const feedbackPersonUUID = content.feedback_person;

  React.useEffect(() => {
    if (loaded && isLoading) {
      toast.success(
        <Toast
          success
          title={intl.formatMessage(messages.success)}
          content={intl.formatMessage(messages.successContent)}
        />,
      );
      history.goBack();
    }
  }, [loaded, isLoading, intl, history]);

  useEffect(() => {
    if (error) {
      toast.error(
        <Toast
          error
          title={intl.formatMessage(messages.error)}
          content={error?.response?.body?.message}
        />,
      );
    }
  }, [error, intl]);

  React.useEffect(() => {
    const userAgent = navigator.userAgent;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    setMetadata({
      user_agent: userAgent,
      window_width: windowWidth,
      window_height: windowHeight,
    });
  }, []);

  const onSubmit = () => {
    console.log('ds', requiredField);
    for (let field of requiredField) {
      if (form[field].length < 1) {
        if (field === 'feedback') {
          setFeedbackError(true);
          return;
        }
        if (field === 'email') {
          setEmailErrorSubmit(true);
          return;
        }
      }
    }
    dispatch(
      submitFeedbackContactForm(flattenToAppURL(content['@id']), {
        ...form,
        feedback_member: feedbackPersonUUID,
        responsible_member: responsiblePersonUUID,
        ...metadata,
      }),
    );
  };
  const onCancel = () => {
    history.goBack();
  };
  const onChangeHandler = (event: any) => {
    if (feedbackError) {
      if (event.target.name === 'feedback') {
        setFeedbackError(false);
      }
    }
    if (event.target.name === 'email') {
      if (
        event.target.value.endsWith('@fz-juelich.de') ||
        event.target.value.endsWith('@kitconcept.com')
      ) {
        setEmailError(false);
      } else {
        setEmailError(true);
        setEmailErrorSubmit(false);
      }
    }
    setForm({ ...form, [event.target.name]: event.target.value });
  };
  return (
    <Container className="feedback-form">
      <div>
        <h2>
          {intl.formatMessage(messages.feedbackOn)} {content?.title}
        </h2>
        <Form>
          <TextField>
            <Label htmlFor="url">{intl.formatMessage(messages.url)}:</Label>
            <Input id="url" name="url" value={PageURl} readOnly={true} />
          </TextField>
          <TextField isInvalid={feedbackError}>
            <Label htmlFor="feedback">
              {intl.formatMessage(messages.feedback)}: *
            </Label>
            <TextArea
              id="feedback"
              rows={6}
              cols={50}
              style={{ height: 'unset' }}
              name="feedback"
              onChange={onChangeHandler}
              value={form.feedback}
              placeholder={
                locale === 'en' ? englishPlaceholder : germanPlaceholder
              }
            />
            <FieldError>
              {intl.formatMessage(messages.feedbackError)}
            </FieldError>
          </TextField>
          <h2 className="feedback-to">
            {intl.formatMessage(messages.feedbackTo)}
          </h2>
          <TextField>
            <Label htmlFor="name">{intl.formatMessage(messages.name)}:</Label>
            <Input
              id="name"
              name="name"
              onChange={onChangeHandler}
              value={form.name}
            />
          </TextField>
          <TextField isInvalid={emailErrorSubmit || emailError}>
            <Label htmlFor="email">
              {intl.formatMessage(messages.email)}: *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              onChange={onChangeHandler}
              value={form.email}
            />
            <FieldError> {intl.formatMessage(messages.emailError)}</FieldError>
            <p className="help">{intl.formatMessage(messages.emailHelpText)}</p>
          </TextField>
          <p>
            {locale === 'en' ? (
              <>
                By submitting this feedback, I agree to the{' '}
                <span>
                  <a href="https://intranet.fz-juelich.de/en/data-protection">
                    data protection declaration.
                  </a>
                </span>
              </>
            ) : (
              <>
                Mit dem Absenden dieses Feedbacks erkläre ich mich mit den{' '}
                <span>
                  <a href="https://intranet.fz-juelich.de/de/datenschutz">
                    Datenschutzbestimmungen
                  </a>
                </span>{' '}
                einverstanden.
              </>
            )}
          </p>
          <div className="feedback-form-buttons">
            <Button type="submit" onClick={onCancel}>
              {intl.formatMessage(messages.cancel)}
            </Button>
            <Button type="submit" onClick={onSubmit}>
              {intl.formatMessage(messages.send)}
            </Button>
          </div>
        </Form>
      </div>
    </Container>
  );
};
export default FeedBackForm;
