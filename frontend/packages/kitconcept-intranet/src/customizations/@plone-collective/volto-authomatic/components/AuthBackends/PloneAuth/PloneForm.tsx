/**
 * OVERRIDE PloneForm.tsx
 * REASON: Clear entered credentials on cancel, or return home if both fields are empty.
 * FILE: https://github.com/collective/volto-authomatic/blob/3.0.0-alpha.6/packages/volto-authomatic/src/components/AuthBackends/PloneAuth/PloneForm.tsx
 * FILE VERSION: volto-authomatic 3.0.0-alpha.6
 * DATE: 2026-09-23
 * DEVELOPER: @iRohitSingh
 */
import React, { useState, FormEvent } from 'react';
import { Button, Container, TextField } from '@plone/components';
import { Link, useHistory } from 'react-router-dom';
import { useIntl } from 'react-intl';

import Icon from '@plone/volto/components/theme/Icon/Icon';
import aheadSVG from '@plone/volto/icons/ahead.svg';
import clearSVG from '@plone/volto/icons/clear.svg';
import messages from '@plone-collective/volto-authomatic/messages';
import Loading from '@plone-collective/volto-authomatic/components/Loading/Loading';

import '@plone/components/src/styles/basic/TextField.css';
import '@plone-collective/volto-authomatic/components/AuthBackends/PloneAuth/PloneForm.scss';

interface PloneFormProps {
  onLogin: (username: string, password: string) => void;
  error: any;
  loading: boolean;
}

const PloneForm: React.FC<PloneFormProps> = ({ onLogin, loading }) => {
  const intl = useIntl();

  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onLogin(loginValue, passwordValue);
  };
  // CUSTOMIZATION START
  const history = useHistory();
  const handleCancel = () => {
    if (loginValue || passwordValue) {
      setLoginValue('');
      setPasswordValue('');
    } else {
      history.push('/');
    }
    // CUSTOMIZATION END
  };

  return (
    <form method="post" className="PloneAuth" onSubmit={handleSubmit}>
      {loading && (
        <Loading
          display={true}
          message={intl.formatMessage(messages.authenticating)}
        />
      )}

      <Container className="form">
        <TextField
          label={intl.formatMessage(messages.loginName)}
          name="username"
          placeholder={intl.formatMessage(messages.loginName)}
          isRequired
          value={loginValue}
          onChange={setLoginValue}
        />
        <TextField
          label={intl.formatMessage(messages.password)}
          name="password"
          type="password"
          placeholder={intl.formatMessage(messages.password)}
          autoComplete="current-password"
          isRequired
          value={passwordValue}
          onChange={setPasswordValue}
        />
      </Container>

      <Container className="forgotPassword">
        <p className="help">
          <Link to="/passwordreset">
            {intl.formatMessage(messages.forgotPassword)}
          </Link>
        </p>
      </Container>

      <Container className="actions">
        <Button
          id="login-form-submit"
          type="submit"
          aria-label={intl.formatMessage(messages.login)}
        >
          <Icon className="circled" name={aheadSVG} size="30px" />
        </Button>

        <Button
          id="login-form-cancel"
          type="button"
          onPress={handleCancel}
          aria-label={intl.formatMessage(messages.cancel)}
        >
          <Icon className="circled" name={clearSVG} size="30px" />
        </Button>
      </Container>
    </form>
  );
};

export default PloneForm;
