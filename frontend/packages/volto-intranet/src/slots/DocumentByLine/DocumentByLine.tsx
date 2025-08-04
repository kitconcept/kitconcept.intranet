import React, { useEffect, useMemo } from 'react';
import type { Content, User } from '@plone/types';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import { useSelector, useDispatch } from 'react-redux';
import { defineMessages, useIntl } from 'react-intl';
import { listUsers } from '@plone/volto/actions/users/users';

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
type Users = {
  users: {
    users: User[];
  };
};
const DocumentByLine = ({ content, ...props }: DocumentByLineProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();

  const userlist = useSelector((state: Users) => state.users?.users || []);
  const form = useSelector((state: FormData) => state.form);
  const isAddMode = props.location.pathname.includes('/add');

  //The expression form.global?.creators ?? content.creators ?? [] creates a new array reference
  //  on every render, even if the values are the same.
  // This makes React think the dependency has changed and re-run
  const creators = useMemo(() => {
    return form.global?.creators ?? content.creators ?? [];
  }, [form.global?.creators, content.creators]);

  useEffect(() => {
    dispatch(listUsers());
  }, [dispatch]);

  const creatorsWithData = useMemo(() => {
    const usersMap = userlist.reduce(
      (map: Record<string, User>, user: User) => {
        map[user.username] = user;
        map[user.id] = user;
        return map;
      },
      {},
    );

    return creators.map((username: string) => {
      const userData = usersMap[username];
      return {
        username,
        fullname: userData?.fullname || username,
        homePage: userData?.home_page || '',
        hasHomePage: !!userData?.home_page,
      };
    });
  }, [userlist, creators]);

  return (
    <>
      <div className="documentByLine">
        {creatorsWithData.length > 0 && (
          <span>
            {intl.formatMessage(messages.author)}
            {creatorsWithData.map(
              ({ username, fullname, homePage, hasHomePage }, index) => (
                <React.Fragment key={username}>
                  {hasHomePage ? (
                    <UniversalLink className="author-name" href={homePage}>
                      {fullname}
                    </UniversalLink>
                  ) : (
                    <span>{fullname}</span>
                  )}
                  {index < creatorsWithData.length - 1 && ', '}
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
