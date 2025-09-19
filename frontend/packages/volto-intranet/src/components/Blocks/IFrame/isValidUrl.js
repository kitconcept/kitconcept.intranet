import { isEmpty } from 'lodash';
import { defineMessages } from 'react-intl';

/**
 * Error messages for displaying toast notifications when an invalid URL
 * is submitted.
 */
export const toastError = defineMessages({
  Title: {
    id: 'Error',
    defaultMessage: 'Error',
  },
  Content: {
    id: 'Invalid url',
    defaultMessage: 'Invalid url',
  },
});

export function isValidUrl(url, siteData) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const allowedDomains =
    siteData?.['kitconcept.intranet.iframe_allowed_domains'] || [];
  const isValid =
    isEmpty(allowedDomains) ||
    allowedDomains.some((pattern) => {
      try {
        // Parse the URL to extract the hostname
        const urlObj = new URL(url);
        const hostname = urlObj.hostname.toLowerCase();
        const patternLower = pattern.toLowerCase();
        return (
          hostname === patternLower || hostname.endsWith('.' + patternLower)
        );
      } catch (e) {
        return false;
      }
    });

  return isValid;
}
