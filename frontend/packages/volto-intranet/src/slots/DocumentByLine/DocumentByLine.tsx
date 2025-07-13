import React, { useMemo } from 'react';
import type { Content, User } from '@plone/types';
import {
  expandToBackendURL,
  flattenToAppURL,
} from '@plone/volto/helpers/Url/Url';
import { useEffect, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

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
type d = {
  content: Content;
  props: any;
};

const DocumentByLine = ({ content }: { content: Content }) => {
  const [creatorProfiles, setCreatorProfiles] = useState<string[][]>([]);
  const [creator, setCreator] = useState('');
  const [updatedCreatorsList, setUpdatedCreatorsList] = useState<string[]>(
    content.creators,
  );

  const intl = useIntl();
  const locked = content.lock.locked;

  const creator_name = useSelector((state: FormState) => state.users.user.id);
  const match = useRouteMatch(flattenToAppURL(`${content['@id']}/edit`));

  useEffect(() => {
    if (creator_name) setCreator(creator_name);
  }, [creator_name]);

  // useEffect(() => {
  //   console.log('Component mounted/remounted', match, is);
  //   return () => {
  //     console.log('Component unmounted', match, is);
  //   };
  // }, []);
  useEffect(() => {
    if (creator && !content.creators.includes(creator)) {
      setUpdatedCreatorsList([...content.creators, creator]);
    } else {
      setUpdatedCreatorsList(content.creators);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator, content.creators]);

  useEffect(() => {
    if (locked === false && creator && !content.creators.includes(creator)) {
      const updateCreators = async () => {
        try {
          console.log('patch', creator);
          await fetch(
            expandToBackendURL(flattenToAppURL(`${content['@id']}`)),
            {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
              },
              body: JSON.stringify({
                creators: updatedCreatorsList,
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
  }, [locked, content.creators, creator, updatedCreatorsList]);

  const getCreatorHomePage = async (username: string): Promise<string> => {
    try {
      const response = await fetch(expandToBackendURL(`/@users/${username}`));
      const data: User = await response.json();
      return data.home_page ?? '';
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    if (content.creators.includes(creator))
      fetchCreatorsProfiles(content.creators);
    else fetchCreatorsProfiles(updatedCreatorsList);
  }, [content.creators, updatedCreatorsList]);

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
  // console.log('edited ', isEditedRef.current);

  return (
    <>
      <div className="documentByLine">
        {creatorProfiles.length > 0 && (
          <span>
            {intl.formatMessage(messages.author)}
            {/* {content.creators},{updatedCreatorsList}, */}
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
