import { useEffect, useRef, useState } from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { toast } from 'react-toastify';
import qs from 'query-string';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import { Button } from '@plone/components';
import backSVG from '@plone/volto/icons/back.svg';
import { useIntl, defineMessages } from 'react-intl';

const messages = defineMessages({
  returnTitle: {
    id: 'Back to the original page',
    defaultMessage: 'Back to the original page',
  },
  returnDescription: {
    id: 'You opened this item from another page. Use the link to return',
    defaultMessage:
      'You opened this item from another page. Use the link to return',
  },
});

const ToastDesign = ({ onReturn, userMessage }) => {
  const handleClickReturn = () => onReturn();

  return (
    <div className="toast-box-center">
      <Button
        aria-label="Return to original page"
        className="return toast-box"
        onClick={handleClickReturn}
      >
        <Icon
          name={backSVG}
          size="24px"
          className="circled toast-box-blue-icon"
        />
      </Button>
      <div>{userMessage}</div>
    </div>
  );
};

export default function ReturnToOriginalToast() {
  const intl = useIntl();
  const location = useLocation();
  const history = useHistory();
  const returnToUrl = qs.parse(location.search).return_to as string | undefined;
  const returnToUrlRef = useRef<string | null>(null);
  const locationUrlRef = useRef(location.pathname);
  useEffect(() => {
    if (returnToUrl) {
      returnToUrlRef.current = returnToUrl;
      locationUrlRef.current = location.pathname;
    }

    if (locationUrlRef.current !== location.pathname) {
      toast.dismiss('returnToOrigin');
      return;
    }
    if (returnToUrlRef.current) {
      setTimeout(() => {
        toast.info(
          <Toast
            info
            title={intl.formatMessage(messages.returnTitle)}
            content={
              <ToastDesign
                onReturn={() => {
                  toast.dismiss('returnToOrigin');
                  history.replace(returnToUrlRef.current);
                }}
                userMessage={intl.formatMessage(messages.returnDescription)}
              />
            }
          />,
          {
            autoClose: false,
            toastId: 'returnToOrigin',
            className: 'return-to-origin-toast',
          },
        );
      }, 100);
    }
    return () => {
      if (toast.isActive('returnToOrigin')) {
        toast.dismiss('returnToOrigin');
      }
    };
  }, [location.search, location.pathname, returnToUrl]);

  return null;
}
