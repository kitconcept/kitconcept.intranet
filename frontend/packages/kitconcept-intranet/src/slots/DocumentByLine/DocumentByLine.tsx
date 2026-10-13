import { useMemo } from 'react';
import type { Content } from '@plone/types';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import { useSelector } from 'react-redux';
import PersonPill from '@kitconcept/intranet/components/PersonPill/PersonPill';
import { defineMessages, useIntl } from 'react-intl';

const messages = defineMessages({
  modified: {
    id: 'modified',
    defaultMessage: 'Updated on',
  },
  jumpToFirstOpenDiscussion: {
    id: 'jumpToFirstOpenDiscussion',
    defaultMessage: 'Jump to the first open comment in the text',
  },
  oneOpenDiscussion: {
    id: 'oneOpenDiscussion',
    defaultMessage: '1 open discussion in text',
  },
  multipleOpenDiscussions: {
    id: 'multipleOpenDiscussions',
    defaultMessage: '{count} open discussions in text',
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
    return form.global?.creators ?? content?.creators ?? [];
  }, [form.global?.creators, content?.creators]);

  const creatorsWithData = useMemo(() => {
    const usersFromExpander = content?.['@components'].byline.users;

    return creators.map((userid: string) => {
      const userData = usersFromExpander?.[userid];
      return {
        id: userid,
        name: userData?.fullname || userid,
        homepage: userData?.homepage,
      };
    });
  }, [creators, content]);

  const discussions = content?.blocks?.['__somersault__']?.discussions;
  const discussionCount = useMemo(() => {
    return Object.values(discussions || {}).reduce((acc, discussion) => {
      return acc + (discussion.isResolved ? 0 : 1);
    }, 0);
  }, [discussions]);

  const jumpToFirstOpenDiscussion = () => {
    const el = document.querySelector<HTMLElement>(
      '.slate-comment[data-comment-id]:not([data-comment-resolved])',
    );
    if (!el) return;

    const block = el.closest<HTMLElement>('[data-block-id]');
    const trigger = block?.querySelector<HTMLElement>(
      'button[data-slot="button"][data-active]',
    );
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (trigger ?? el).click();
  };

  if (!content) {
    return null;
  }

  const hasCreators = creatorsWithData.length > 0;
  const showModified = !isAddMode && !!content.modified;

  return (
    <>
      <div className="documentByLine">
        {hasCreators && (
          <span className="documentByLine-creators">
            {creatorsWithData.map(({ id, name }, index) => (
              <span className="documentByLine-creator" key={id}>
                <PersonPill id={id} fullname={name} />
                {index < creatorsWithData.length - 1 && ','}
              </span>
            ))}
          </span>
        )}
        {showModified && (
          <span className="modified-date">
            {hasCreators && '· '}
            {intl.formatMessage(messages.modified)}{' '}
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
        {discussionCount > 0 && (hasCreators || showModified) && (
          <span className="documentByLine-separator" aria-hidden="true">
            ·
          </span>
        )}
        {discussionCount > 0 && (
          <button
            type="button"
            className="open-discussions"
            title={intl.formatMessage(messages.jumpToFirstOpenDiscussion)}
            onClick={jumpToFirstOpenDiscussion}
          >
            <span className="open-discussions-dot" aria-hidden="true" />
            <span>
              {discussionCount === 1
                ? intl.formatMessage(messages.oneOpenDiscussion)
                : intl.formatMessage(messages.multipleOpenDiscussions, {
                    count: discussionCount,
                  })}
            </span>
          </button>
        )}
      </div>
    </>
  );
};

export default DocumentByLine;
