/**
 * OVERRIDE: FollowUsLogoAndLinks
 * REASON: Footer links should contains Feedback form link
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/issues/124#note_21478
 * ORIGINAL: @kitconcept/volto-light-theme
 * FILE VERSION: 7.0.0a23
 * DATE: 2025-08-25
 * DEVELOPER: @iFlameing
 */

import { FormattedMessage, useIntl, defineMessages } from 'react-intl';
import { useLocation } from 'react-router-dom';
import cx from 'classnames';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import ConditionalLink from '@plone/volto/components/manage/ConditionalLink/ConditionalLink';
import { Container } from '@plone/components';
import { useLiveData } from '@kitconcept/volto-light-theme/helpers/useLiveData';
import LinkList from '@kitconcept/volto-light-theme/primitives/LinkList';
import type {
  PloneGobrSocialMediaSettings,
  SiteFooterSettings,
} from '@kitconcept/volto-light-theme/types';
import type { Content } from '@plone/types';
import SlotRenderer from '@plone/volto/components/theme/SlotRenderer/SlotRenderer';

const messages = defineMessages({
  feedback: {
    id: 'Feedback about this page',
    defaultMessage: 'Feedback about this page',
  },
});

const FollowUsPostFooterLogoAndLinks = ({ content }: { content: Content }) => {
  const social_links = useLiveData<
    PloneGobrSocialMediaSettings['social_links']
  >(content, 'plonegovbr.socialmedia.settings', 'social_links');

  const intl = useIntl();
  const location = useLocation();
  const showFeedbackFormLink =
    content?.authors ||
    content?.responsible_person ||
    content?.feedback_person ||
    content?.['@components']?.lcm?.responsible_person?.url;

  let footer_links = useLiveData<SiteFooterSettings['footer_links']>(
    content,
    'voltolighttheme.footer',
    'footer_links',
  );
  /* START CUSTOMIZATION */
  footer_links = [
    ...(footer_links || []),
    ...(showFeedbackFormLink
      ? [
          {
            '@id': '8b42f8f4-3d6e-4c97-9b8c-27c51e8b29a1',
            href: [
              {
                '@id': `${location.pathname === '/' ? '' : location.pathname}/feedback-form`,
                Title: intl.formatMessage(messages.feedback),
                title: intl.formatMessage(messages.feedback),
              },
            ],
            title: intl.formatMessage(messages.feedback),
          },
        ]
      : []),
  ];
  /* END CUSTOMIZATION */
  const post_footer_logo = useLiveData<SiteFooterSettings['post_footer_logo']>(
    content,
    'kitconcept.footer',
    'post_footer_logo',
  );

  const footerLogoSrc = post_footer_logo?.data
    ? `data:${post_footer_logo['content-type']};base64,${post_footer_logo.data}`
    : flattenToAppURL(post_footer_logo?.download);

  return content ? (
    <Container
      className={cx('default follow-us-links-and-logo', {
        'no-logo': !post_footer_logo?.data && !post_footer_logo?.download,
      })}
    >
      <div className="followus-and-links">
        {social_links?.length > 0 && (
          <div className="follow-us">
            <span>
              <FormattedMessage id="Follow us:" defaultMessage="Follow us:" />
            </span>
            <SlotRenderer name="followUs" content={content} />
          </div>
        )}
        {footer_links?.length > 0 && (
          <div className="footer-links">
            <SlotRenderer name="footerLinks" content={content} />
            <LinkList links={footer_links} />
          </div>
        )}
      </div>
      {post_footer_logo?.data || post_footer_logo?.download ? (
        <div className="footer-logo">
          <span>
            <FormattedMessage
              id="Sponsored by:"
              defaultMessage="Sponsored by:"
            />
          </span>
          {/* @ts-ignore */}
          <ConditionalLink
            condition={content?.post_footer_logo_link}
            to={content?.post_footer_logo_link}
            openLinkInNewTab={true}
          >
            <img src={footerLogoSrc} alt="Sponsor Logo" />
          </ConditionalLink>
        </div>
      ) : null}
    </Container>
  ) : null;
};

export default FollowUsPostFooterLogoAndLinks;
