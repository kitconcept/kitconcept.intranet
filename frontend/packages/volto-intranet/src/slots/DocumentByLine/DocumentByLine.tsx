import React, { useMemo } from 'react';
import type { Content, User } from '@plone/types';
import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';
import useUser from '@plone/volto/hooks/user/useUser';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { setFormData } from '@plone/volto/actions/form/form';

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
const DocumentByLine = ({ content, ...props }: DocumentByLineProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  const [creatorProfiles, setCreatorProfiles] = useState<string[][]>([]);

  const form = useSelector((state: FormData) => state.form);

  const user = useUser();
  const userId = user?.id;

  const isAddMode = props.location.pathname.includes('/add');

  useEffect(() => {
    if (
      content.lock.locked === true &&
      !content.creators.includes(userId) &&
      userId
    ) {
      dispatch(
        setFormData({
          ...form?.global,
          creators: [...content.creators, userId],
        }),
      );
    }
  }, [userId, content.lock.locked, content.creators, dispatch, form?.global]);

  useEffect(() => {
    if (content.lock.locked === true && !isAddMode) {
      fetchCreatorProfiles(form.global?.creators ?? content?.creators);
    } else if (!isAddMode) {
      fetchCreatorProfiles(content?.creators);
    } else {
      fetchCreatorProfiles([userId ?? 'user']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.lock.locked, form.global?.creators]);

  const getCreatorHomePage = async (username: string): Promise<string> => {
    try {
      const response = await fetch(expandToBackendURL(`/@users/${username}`));
      const data: User = await response.json();
      return data.home_page;
    } catch (error) {
      return '';
    }
  };

  const fetchCreatorProfiles = async (creators: string[]) => {
    const result = await Promise.all(
      creators.map(async (user) => {
        if (user === 'user') return [user, ''];
        const abt = await getCreatorHomePage(user);
        return [user, abt || ''];
      }),
    );
    setCreatorProfiles(result);
  };

  const formattedDates = useMemo(() => {
    const formatDate = (isoString: string): string => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return isNaN(date.getTime())
        ? ''
        : date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
    };

    const getCurrentTimeISO = (): string => new Date().toISOString();

    return {
      effective: formatDate(content?.effective ?? ''),
      modified: formatDate(content?.modified || getCurrentTimeISO()),
    };
  }, [content?.effective, content?.modified]);

  return (
    <>
      <div className="documentByLine">
        {creatorProfiles.length > 0 && (
          <span>
            {intl.formatMessage(messages.author)}
            {creatorProfiles.map(([name, url], index) =>
              url ? (
                <React.Fragment key={index}>
                  <a className="byAuthor" href={url}>
                    {name}
                  </a>
                  {index < creatorProfiles.length && ' '}
                </React.Fragment>
              ) : (
                <React.Fragment key={index}>
                  <span className="byAuthor">{name}</span>
                  {index < creatorProfiles.length && ' '}
                </React.Fragment>
              ),
            )}
          </span>
        )}
        {formattedDates.effective && (
          <span className="documentPublished">
            {content.review_state === 'published' ? (
              <span>
                — {intl.formatMessage(messages.published)}
                {formattedDates.effective}
              </span>
            ) : (
              ''
            )}
          </span>
        )}
        {formattedDates.modified && (
          <span className="documentModified">
            , {intl.formatMessage(messages.modified)}
            {formattedDates.modified}
          </span>
        )}
      </div>
    </>
  );
};

export default DocumentByLine;
