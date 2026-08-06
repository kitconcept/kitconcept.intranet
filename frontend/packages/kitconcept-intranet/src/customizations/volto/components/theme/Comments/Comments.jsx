/**
 * OVERRIDE Comments.jsx
 * REASON: Update the comments component layout, styling, and footer placement.
 * FILE: https://github.com/plone/volto/blob/main/packages/volto/src/components/theme/Comments/Comments.jsx
 * FILE VERSION: Volto 19.3.0
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/557
 * DATE: 2026-08-06
 * DEVELOPER: @iRohitSingh
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { compose } from 'redux';
import { Button, Container } from '@plone/components';

import {
  addComment,
  deleteComment,
  listComments,
  listMoreComments,
} from '@plone/volto/actions/comments/comments';
import Avatar from '@plone/volto/components/theme/Avatar/Avatar';
import { CommentEditModal } from '@plone/volto/components/theme/Comments';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { injectLazyLibs } from '@plone/volto/helpers/Loadable/Loadable';
import { flattenToAppURL, getBaseUrl } from '@plone/volto/helpers/Url/Url';
import { usePrevious } from '@plone/volto/helpers/Utils/usePrevious';
import useUser from '@plone/volto/hooks/user/useUser';
import commentSVG from '@plone/volto/icons/comment.svg';
import sendSVG from '@plone/volto/icons/send.svg';

const messages = defineMessages({
  addComment: {
    id: 'Add comment... (@ mention a person)',
    defaultMessage: 'Add comment... (@ mention a person)',
  },
  comments: {
    id: 'Comments',
    defaultMessage: 'Comments',
  },
  delete: {
    id: 'Delete',
    defaultMessage: 'Delete',
  },
  edit: {
    id: 'Edit',
    defaultMessage: 'Edit',
  },
  reply: {
    id: 'Reply',
    defaultMessage: 'Reply',
  },
  send: {
    id: 'Send comment',
    defaultMessage: 'Send comment',
  },
  visibility: {
    id: 'Visible to everyone who can see this page.',
    defaultMessage: 'Visible to everyone who can see this page.',
  },
});

const useComments = () => {
  const items = useSelector((state) => state.comments.items, shallowEqual);
  const next = useSelector((state) => state.comments.next, shallowEqual);
  const itemsTotal = useSelector(
    (state) => state.comments.items_total,
    shallowEqual,
  );
  const permissions = useSelector(
    (state) => state.comments.permissions || {},
    shallowEqual,
  );
  const addRequest = useSelector((state) => state.comments.add, shallowEqual);
  const deleteRequest = useSelector(
    (state) => state.comments.delete,
    shallowEqual,
  );
  return { items, next, itemsTotal, permissions, addRequest, deleteRequest };
};

const CommentComposer = ({ onSubmit, user, compact = false }) => {
  const intl = useIntl();
  const [value, setValue] = useState('');
  const submit = (event) => {
    event.preventDefault();
    const comment = value.trim();
    if (!comment) return;
    onSubmit(comment);
    setValue('');
  };

  return (
    <form
      className={compact ? 'intranet-comments__reply-form' : undefined}
      onSubmit={submit}
    >
      <div className="intranet-comments__composer">
        <Avatar
          size={30}
          src={flattenToAppURL(user?.portrait)}
          title={user?.username || user?.id || user?.fullname || 'User'}
          color="#f3e4c2"
        />
        <div className="intranet-comments__field">
          <textarea
            aria-label={intl.formatMessage(messages.addComment)}
            className="intranet-comments__input"
            onChange={(event) => setValue(event.target.value)}
            placeholder={intl.formatMessage(messages.addComment)}
            rows="1"
            value={value}
          />
          <Button
            aria-label={intl.formatMessage(messages.send)}
            className="intranet-comments__submit"
            isDisabled={!value.trim()}
            type="submit"
          >
            <Icon name={sendSVG} size="36px" />
          </Button>
        </div>
        {!compact && (
          <p className="intranet-comments__visibility">
            {intl.formatMessage(messages.visibility)}
          </p>
        )}
      </div>
    </form>
  );
};

CommentComposer.propTypes = {
  compact: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  user: PropTypes.object,
};

const CommentsView = ({ pathname, moment }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const user = useUser();
  const [showEdit, setShowEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const { items, next, itemsTotal, permissions, addRequest, deleteRequest } =
    useComments();
  const previousPathname = usePrevious(pathname);
  const previousAddLoading = usePrevious(addRequest.loading);
  const previousDeleteLoading = usePrevious(deleteRequest.loading);

  useEffect(() => {
    if (
      pathname !== previousPathname ||
      (previousAddLoading && addRequest.loaded) ||
      (previousDeleteLoading && deleteRequest.loaded)
    ) {
      dispatch(listComments(getBaseUrl(pathname)));
    }
  }, [
    addRequest.loaded,
    deleteRequest.loaded,
    dispatch,
    pathname,
    previousAddLoading,
    previousDeleteLoading,
    previousPathname,
  ]);

  const submitComment = (text, parentId = null) => {
    dispatch(addComment(getBaseUrl(pathname), text, parentId));
    setReplyTo(null);
  };

  const onEdit = useCallback((value) => {
    setShowEdit(true);
    setEditText(value.text);
    setEditId(value.id);
  }, []);

  const closeEdit = useCallback(() => {
    setShowEdit(false);
    setEditId(null);
    setEditText(null);
    setReplyTo(null);
  }, []);

  const commentsById = useMemo(() => {
    const result = items.reduce(
      (comments, item) => ({
        ...comments,
        [item.comment_id]: { comment: item, children: [] },
      }),
      {},
    );
    items.forEach((item) => {
      if (item.in_reply_to && result[item.in_reply_to]) {
        result[item.in_reply_to].children.push(item);
      }
    });
    return result;
  }, [items]);

  const primaryComments = items.filter((item) => !item.in_reply_to);
  const relativeDate = moment.default;

  const renderComment = (comment) => {
    const children = commentsById[comment.comment_id]?.children || [];
    return (
      <article
        className="comment"
        key={comment.comment_id}
        id={comment.comment_id}
      >
        <Avatar
          size={30}
          src={flattenToAppURL(comment.author_image)}
          title={comment.author_name || 'Anonymous'}
          color="#f3e4c2"
        />
        <div className="content">
          <h3 className="author">{comment.author_name}</h3>
          <div className="metadata">
            <span title={relativeDate(comment.creation_date).format('LLLL')}>
              {relativeDate(comment.creation_date).fromNow()}
            </span>
          </div>
          <div className="text">
            {comment.text['mime-type'] === 'text/html' ? (
              <div dangerouslySetInnerHTML={{ __html: comment.text.data }} />
            ) : (
              comment.text.data
            )}
          </div>
          <div className="actions">
            {comment.can_reply && (
              <Button
                aria-label={intl.formatMessage(messages.reply)}
                className="action"
                onClick={() => setReplyTo(comment.comment_id)}
              >
                <FormattedMessage id="Reply" defaultMessage="Reply" />
              </Button>
            )}
            {comment.is_editable && (
              <Button
                aria-label={intl.formatMessage(messages.edit)}
                className="action"
                onClick={() =>
                  onEdit({
                    id: flattenToAppURL(comment['@id']),
                    text: comment.text.data,
                  })
                }
              >
                <FormattedMessage id="Edit" defaultMessage="Edit" />
              </Button>
            )}
            {comment.is_deletable && (
              <Button
                aria-label={intl.formatMessage(messages.delete)}
                className="action delete-action"
                onClick={() =>
                  dispatch(deleteComment(flattenToAppURL(comment['@id'])))
                }
              >
                <FormattedMessage id="Delete" defaultMessage="Delete" />
              </Button>
            )}
          </div>
          <div id={`reply-place-${comment.comment_id}`} />
        </div>
        {children.length > 0 && (
          <div className="comments">
            {children.map((child) => renderComment(child))}
          </div>
        )}
      </article>
    );
  };

  if (!permissions.view_comments) return null;

  return (
    <Container className="comments intranet-comments">
      <CommentEditModal
        id={editId}
        onCancel={closeEdit}
        onOk={() => {
          closeEdit();
          dispatch(listComments(getBaseUrl(pathname)));
        }}
        open={showEdit}
        text={editText}
      />
      <h2 className="intranet-comments__heading">
        <Icon name={commentSVG} size="32px" />
        {intl.formatMessage(messages.comments)} ({itemsTotal || 0})
      </h2>
      <div className="threaded comments" id="discussion">
        {primaryComments.map(renderComment)}
      </div>
      {itemsTotal > items.length && (
        <Button
          className="intranet-comments__load-more"
          onClick={() => dispatch(listMoreComments(flattenToAppURL(next)))}
        >
          <FormattedMessage id="Load more" defaultMessage="Load more..." />
        </Button>
      )}
      {permissions.can_reply && (
        <CommentComposer onSubmit={submitComment} user={user} />
      )}
      {replyTo &&
        typeof document !== 'undefined' &&
        createPortal(
          <CommentComposer
            compact
            onSubmit={(text) => submitComment(text, replyTo)}
            user={user}
          />,
          document.getElementById(`reply-place-${replyTo}`),
        )}
    </Container>
  );
};

CommentsView.propTypes = {
  moment: PropTypes.object.isRequired,
  pathname: PropTypes.string.isRequired,
};

const Comments = ({ inFooterSlot = false, ...props }) =>
  inFooterSlot ? <CommentsView {...props} /> : null;

Comments.propTypes = {
  inFooterSlot: PropTypes.bool,
};

export default compose(injectLazyLibs(['moment']))(Comments);
