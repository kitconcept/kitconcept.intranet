import React from 'react';
import type { Content, User } from '@plone/types';
import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { useEffect, useState } from 'react';
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
type DocumentByLineProps = {
  content: Content;
  location: {
    pathname: string;
  };
};

const useCreatorUrl = async (username: string): Promise<string> => {
  try {
    const response = await fetch(expandToBackendURL(`/@users/${username}`));
    const data: User = await response.json();
    return data.home_page;
  } catch (error) {
    return '';
  }
};

const DocumentByLine = ({ content, ...props }: DocumentByLineProps) => {
  const intl = useIntl();

  const [creatorProfiles, setCreatorProfiles] = useState<string[][]>([]);
  const form = useSelector((state: FormData) => state.form);
  const isAddMode = props.location.pathname.includes('/add');
  const creators = form.global?.creators ?? content.creators ?? [];

  useEffect(() => {
    fetchCreatorProfiles(creators);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.global?.creators, content.creators]);

  const fetchCreatorProfiles = async (creators: string[]) => {
    const result = await Promise.all(
      creators.map(async (user) => {
        const profileUrl = await useCreatorUrl(user);
        return [user, profileUrl || ''];
      }),
    );
    setCreatorProfiles(result);
  };

  return (
    <>
      <div className="documentByLine">
        {creatorProfiles.length > 0 && (
          <span>
            {intl.formatMessage(messages.author)}
            {creatorProfiles.map(([name, url], index) =>
              url ? (
                <React.Fragment key={index}>
                  <UniversalLink className="author-name" href={url}>
                    {name}
                  </UniversalLink>
                  {index < creatorProfiles.length - 1 && ', '}
                </React.Fragment>
              ) : (
                <React.Fragment key={index}>
                  <span>{name}</span>
                  {index < creatorProfiles.length - 1 && ', '}
                </React.Fragment>
              ),
            )}
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
