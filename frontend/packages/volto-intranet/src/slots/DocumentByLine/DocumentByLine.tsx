import React, { useMemo } from 'react';
import type { Content, User } from '@plone/types';
import {
  expandToBackendURL,
  flattenToAppURL,
} from '@plone/volto/helpers/Url/Url';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { shallowEqual, useSelector } from 'react-redux';

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

type FormState = {
  users: { user: User };
};

const DocumentByLine = ({ content }: { content: Content }) => {
  const [creatorProfiles, setCreatorProfiles] = useState<string[][]>([]);
  const [creator, setCreator] = useState('');

  const [updatedCreatorsList, setUpdatedCreatorsList] = useState<string[]>(
    content.creators || [],
  );

  const intl = useIntl();
  const locked = content.lock.locked;

  const creator_name = useSelector(
    (state: FormState) => state.users.user.id,
    shallowEqual,
  );

  useEffect(() => {
    if (
      sessionStorage.getItem(`edit-${content.id}`) === '1' &&
      !content.creators.includes(creator_name) &&
      creator_name
    )
      setCreator(creator_name);
    else {
      sessionStorage.setItem(`edit-${content.id}`, '0');
      setCreator('');
    }
    if (
      location.pathname.includes('/edit') &&
      !content.creators.includes(creator_name)
    )
      setCreator(creator_name);
  }, [creator_name, content.id]);

  useEffect(() => {
    if (!content.creators.includes(creator_name) && locked)
      sessionStorage.setItem(`edit-${content.id}`, '1');
  }, [content.id]);

  useEffect(() => {
    if (
      updatedCreatorsList &&
      creator !== '' &&
      !updatedCreatorsList?.includes(creator)
    ) {
      setUpdatedCreatorsList((prevCreators) => [...prevCreators, creator]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  useEffect(() => {
    if (locked === false && !content.creators.includes(creator)) {
      const updateCreators = async () => {
        try {
          await fetch(
            expandToBackendURL(flattenToAppURL(`${content['@id']}`)),
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                creators: [...content.creators, creator],
              }),
            },
          );
        } catch (error) {
          return error;
        }
      };
      updateCreators();
    }
    //  eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, updatedCreatorsList, content.creators]);

  useEffect(() => {
    if (content.creators.includes(creator))
      fetchCreatorsProfiles(content.creators);
    else fetchCreatorsProfiles(updatedCreatorsList);
  }, [content.creators, updatedCreatorsList]);

  //removes from the session storage after use
  useEffect(() => {
    const currentContentId = content.id;
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('edit-') && key !== `edit-${currentContentId}`) {
        sessionStorage.removeItem(key);
      }
    });
  }, [content['@id']]);

  const getCreatorHomePage = async (username: string): Promise<string> => {
    try {
      const response = await fetch(expandToBackendURL(`/@users/${username}`));
      const data: User = await response.json();
      return data.home_page ?? '';
    } catch (error) {
      return '';
    }
  };
  const fetchCreatorsProfiles = async (creatorsArray: string[]) => {
    if (!creatorsArray || creatorsArray.length === 0) {
      setCreatorProfiles([]);
      return;
    }
    const result = await Promise.all(
      creatorsArray.map(async (user) => {
        const user_url = await getCreatorHomePage(user);
        return [user, user_url || ''];
      }),
    );

    setCreatorProfiles(result);
  };

  //Get the dates formatted
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

    return {
      effective: formatDate(content?.effective ?? ''),
      modified: formatDate(content.modified),
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
