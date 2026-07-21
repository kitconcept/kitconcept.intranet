import { useEffect } from 'react';
import type { Content } from '@plone/types';
import { getContent } from '@plone/volto/actions/content/content';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import {
  expandToBackendURL,
  flattenToAppURL,
} from '@plone/volto/helpers/Url/Url';
import { defineMessages, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import avatarPlaceholder from '../../assets/avatar-placeholder.svg';
import responsibleImage from '../../assets/avatar-placeholder.svg';
import calendarSVG from '@plone/volto/icons/calendar.svg';

const messages = defineMessages({
  title: {
    id: 'About this content',
    defaultMessage: 'About this content',
  },
  author: {
    id: 'Author',
    defaultMessage: 'Author',
  },
  responsible: {
    id: 'Content responsible',
    defaultMessage: 'Content responsible',
  },
  created: {
    id: 'Created on',
    defaultMessage: 'Created on',
  },
  modified: {
    id: 'Last modified on',
    defaultMessage: 'Last modified on',
  },
});

type UserData = {
  fullname?: string;
  homepage?: string | null;
  portrait?: string | null;
};

type ContentWithBylineExpander = Content & {
  created?: string;
  modified?: string;
  '@components'?: {
    byline?: {
      users?: Record<string, UserData>;
    };
    clm?: {
      responsible_person?: {
        person_url?: string;
        url?: string;
      };
    };
  };
};

type PersonContent = Content & {
  image?: unknown;
  title?: string;
};

type AboutThisContentProps = {
  content: ContentWithBylineExpander;
};

type ReduxState = {
  content: {
    data?: ContentWithBylineExpander;
    subrequests?: Record<
      string,
      {
        data?: Content;
        error?: unknown;
        loaded?: boolean;
        loading?: boolean;
      }
    >;
  };
};

const dateFormat = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
} as const;

const AboutThisContent = ({ content }: AboutThisContentProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const contentFromState = useSelector(
    (state: ReduxState) => state.content.data,
  );
  const contentData = contentFromState ?? content;
  const creators = contentData?.creators ?? [];
  const usersFromExpander = contentData?.['@components']?.byline?.users ?? {};
  const creatorsWithData = creators.map((userid: string) => {
    const userData = usersFromExpander[userid];

    return {
      name: userData?.fullname || userid,
      portrait: userData?.portrait,
    };
  });
  const hasAuthors = creatorsWithData.length > 0;
  const responsiblePersonUrl =
    contentData?.['@components']?.clm?.responsible_person?.person_url;
  const responsiblePersonPath = responsiblePersonUrl
    ? flattenToAppURL(responsiblePersonUrl)
    : null;
  const responsiblePersonRequest = useSelector((state: ReduxState) =>
    responsiblePersonPath
      ? state.content.subrequests?.[
          `responsible-person-${responsiblePersonPath}`
        ]
      : undefined,
  );
  const responsiblePersonContent = responsiblePersonRequest?.data as
    | PersonContent
    | undefined;

  useEffect(() => {
    if (!hasAuthors || !responsiblePersonPath || responsiblePersonRequest) {
      return;
    }

    dispatch(
      getContent(
        responsiblePersonPath,
        null,
        `responsible-person-${responsiblePersonPath}`,
      ),
    );
  }, [dispatch, hasAuthors, responsiblePersonPath, responsiblePersonRequest]);

  if (!contentData) {
    return null;
  }

  if (!hasAuthors) {
    return null;
  }

  return (
    <section className="about-content" aria-labelledby="about-content-title">
      <h2 id="about-content-title">{intl.formatMessage(messages.title)}</h2>
      <div className="about-content-grid">
        <div className="about-content-item">
          <h3>{intl.formatMessage(messages.author)}</h3>
          <div className="about-content-people">
            {creatorsWithData.map(({ name, portrait }) => (
              <div className="about-content-person" key={name}>
                <img
                  className="about-content-avatar"
                  src={
                    portrait ? expandToBackendURL(portrait) : avatarPlaceholder
                  }
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                />
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>
        {responsiblePersonUrl && responsiblePersonContent?.title && (
          <div className="about-content-item">
            <h3>{intl.formatMessage(messages.responsible)}</h3>
            <div className="about-content-person">
              <img
                className="about-content-avatar"
                src={
                  responsiblePersonContent.image &&
                  responsiblePersonContent['@id']
                    ? `${flattenToAppURL(
                        responsiblePersonContent['@id'],
                      )}/@@images/image/mini`
                    : responsibleImage
                }
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
              <UniversalLink href={responsiblePersonUrl}>
                {responsiblePersonContent.title}
              </UniversalLink>
            </div>
          </div>
        )}
        {contentData.created && (
          <div className="about-content-item">
            <h3>{intl.formatMessage(messages.created)}</h3>
            <div className="about-content-date">
              <Icon name={calendarSVG} size="28px" />
              <FormattedDate
                className=""
                date={contentData.created}
                format={dateFormat}
                includeTime={false}
                locale={intl.locale}
                long={false}
                relative={false}
              >
                {null}
              </FormattedDate>
            </div>
          </div>
        )}
        {contentData.modified && (
          <div className="about-content-item">
            <h3>{intl.formatMessage(messages.modified)}</h3>
            <div className="about-content-date">
              <Icon name={calendarSVG} size="28px" />
              <FormattedDate
                className=""
                date={contentData.modified}
                format={dateFormat}
                includeTime={false}
                locale={intl.locale}
                long={false}
                relative={false}
              >
                {null}
              </FormattedDate>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutThisContent;
