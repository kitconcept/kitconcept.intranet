import React from 'react';
import type { Content, User } from '@plone/types';
import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';
import { useEffect, useState } from 'react';

const DocumentByLine = ({ content }: { content: Content }) => {
  const [creatorProfiles, setCreatorProfiles] = useState<string[][]>([]);

  const getCreatorHomePage = async (username: string): Promise<string> => {
    try {
      const response = await fetch(expandToBackendURL(`/@users/${username}`));
      const data: User = await response.json();
      return data.home_page;
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const fetchCreatorProfiles = async () => {
      const result = await Promise.all(
        content.creators.map(async (user) => {
          const abt = await getCreatorHomePage(user);
          return [user, abt || ''];
        }),
      );
      setCreatorProfiles(result);
    };
    fetchCreatorProfiles();
  }, [content.creators]);

  const formatDate = (ISOstring: string): String => {
    const date: Date = new Date(ISOstring);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formattedEffectiveDate = formatDate(content?.effective ?? '');
  const formattedModifiedDate = formatDate(content.modified);

  return (
    <div className="documentByLine">
      <span>
        by{' '}
        {creatorProfiles.map(([name, url], index) =>
          url ? (
            <React.Fragment key={index}>
              <a className="byAuthor" href={url}>
                {name}
              </a>
              {index < creatorProfiles.length - 1 && ' '}
            </React.Fragment>
          ) : (
            <React.Fragment key={index}>
              <span className="byAuthor">{name}</span>
              {index < creatorProfiles.length - 1 && ' '}
            </React.Fragment>
          ),
        )}
      </span>
      <span className="documentPublished">
        {content.review_state === 'published' ? (
          <span> — published {formattedEffectiveDate} </span>
        ) : (
          ''
        )}
      </span>
      <span className="documentModified">
        , last modified {formattedModifiedDate}
      </span>
    </div>
  );
};

export default DocumentByLine;
