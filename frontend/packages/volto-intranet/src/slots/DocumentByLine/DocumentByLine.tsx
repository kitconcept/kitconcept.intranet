import React, { useMemo } from 'react';
import type { Content } from '@plone/types';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  author: {
    id: 'author',
    defaultMessage: 'By ',
  },
  published: {
    id: 'published',
    defaultMessage: ' published ',
  },
  modified: {
    id: 'modified',
    defaultMessage: ' last modified ',
  },
});

type FormData = {
  form: {
    global: Content;
  };
};

type UserData = {
  fullname: string;
  homepage: string | null;
};

type ContentWithBylineExpander = Content & {
  '@components': {
    byline: {
      users: Record<string, UserData>;
    };
  };
};

type DocumentByLineProps = {
  content: ContentWithBylineExpander;
  location: {
    pathname: string;
  };
};

const DocumentByLine = ({ content, ...props }: DocumentByLineProps) => {
  const intl = useIntl();

  const form = useSelector((state: FormData) => state.form);
  const isAddMode = props.location.pathname.includes('/add');

  //The expression form.global?.creators ?? content.creators ?? [] creates a new array reference
  //  on every render, even if the values are the same.
  // This makes React think the dependency has changed and re-run
  const creators = useMemo(() => {
    return form.global?.creators ?? content.creators ?? [];
  }, [form.global?.creators, content.creators]);

  const creatorsWithData = useMemo(() => {
    const usersFromExpander = content['@components'].byline.users;
    return creators.map((userid: string) => {
      const userData = usersFromExpander[userid];
      // The user data may not be found if a new user was selected
      // or if a creator was entered that is not a username.
      return {
        name: userData?.fullname || userid,
        homepage: userData?.homepage,
      };
    });
  }, [creators, content]);

  return (
    <>
      <div className="documentByLine">
        {creatorsWithData.length > 0 && (
          <span>
            {intl.formatMessage(messages.author)}
            {creatorsWithData.map(({ name, homepage }, index) => (
              <React.Fragment key={name}>
                {homepage ? (
                  <UniversalLink className="author-name" href={homepage}>
                    {name}
                  </UniversalLink>
                ) : (
                  <span>{name}</span>
                )}
                {index < creatorsWithData.length - 1 && ', '}
              </React.Fragment>
            ))}
            {' —'}
          </span>
        )}
        {content.effective && !isAddMode && (
          <span>
            {content.review_state === 'published' ? (
              <span>
                {intl.formatMessage(messages.published)}
                <FormattedDate
                  date={form.global?.effective ?? content?.effective}
                  format={{
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }}
                  locale={intl.locale}
                />
                ,
              </span>
            ) : (
              ''
            )}
          </span>
        )}
        {content.modified && !isAddMode && (
          <span>
            {intl.formatMessage(messages.modified)}
            <FormattedDate
              date={content.modified}
              format={{
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }}
              locale={intl.locale}
            />
          </span>
        )}
      </div>
    </>
  );
};

export default DocumentByLine;
