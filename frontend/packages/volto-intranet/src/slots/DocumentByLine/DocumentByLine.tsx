import React from 'react';
import type { Content, User } from '@plone/types';
import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';
import { useEffect, useState } from 'react';

const DocumentByLine = ({ content }: { content: Content }) => {
  const [creatorsProfile, setCreatorInfo] = useState<string[][]>([]);

  const creatorProfile = async (username: string): Promise<string> => {
    try {
      const response = await fetch(expandToBackendURL(`/@users/${username}`));
      const data: User = await response.json();
      return data.home_page;
    } catch (error) {
      return '';
    }
  };

  useEffect(() => {
    const fetchCreatorInfo = async () => {
      const result = await Promise.all(
        content.creators.map(async (user) => {
          const abt = await creatorProfile(user);
          return [user, abt || ''];
        }),
      );
      setCreatorInfo(result);
    };
    fetchCreatorInfo();
  }, [content.creators]);

  const dateStringConvert = (ISOstring: string): String => {
    const date: Date = new Date(ISOstring);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatted_effective_date = dateStringConvert(content?.effective ?? '');
  const formatted_modified_date = dateStringConvert(content.modified);

  return (
    <div className="documentByLine">
      <span>
        by{' '}
        {creatorsProfile.map(([name, url], index) =>
          url ? (
            <React.Fragment key={index}>
              <a className="byAuthor" href={url}>
                {name}
              </a>
              {index < creatorsProfile.length - 1 && ' '}
            </React.Fragment>
          ) : (
            <React.Fragment key={index}>
              <span className="byAuthor">{name}</span>
              {index < creatorsProfile.length - 1 && ' '}
            </React.Fragment>
          ),
        )}
      </span>
      <span className="documentPublished">
        {content.review_state === 'published' ? (
          <span> — published {formatted_effective_date} </span>
        ) : (
          ''
        )}
      </span>
      <span className="documentModified">
        , last modified {formatted_modified_date}
      </span>
    </div>
  );
};

export default DocumentByLine;
