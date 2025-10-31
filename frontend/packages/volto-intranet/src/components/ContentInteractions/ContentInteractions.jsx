import { Button, Container } from '@plone/components';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import jwtDecode from 'jwt-decode';
import { getUser } from '@plone/volto/actions/users/users';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import cx from 'classnames';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import { toggleLike } from '../../actions/likes/likes';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import thumbsSVG from '../../icons/icon-thumbs.svg';
import thumbsFilledSVG from '../../icons/icon-thumbs-filled.svg';
import commentSVG from '../../icons/comment.svg';
import shareSVG from '../../icons/share.svg';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';

const messages = defineMessages({
  loginToLike: {
    id: 'To submit a Like you must be logged in',
    defaultMessage: 'To submit a Like you must be logged in',
  },
  modified: {
    id: 'Last Modified On',
    defaultMessage: 'Last Modified On',
  },
  created: {
    id: 'Created On',
    defaultMessage: 'Created On',
  },
  share: {
    id: 'Share Content',
    defaultMessage:
      'Recommendation from the Intranet&body=I would like to share this intranet content with you:',
  },
  shareTitle: {
    id: 'Share this page via email',
    defaultMessage: 'Share this page via email',
  },
  shareSubject: {
    id: 'shareSubject',
    defaultMessage: 'Intranet reading tip',
  },
  likeFailed: {
    id: 'Something went wrong while liking this post.',
    defaultMessage: 'Something went wrong while liking this post.',
  },
  unlikeFailed: {
    id: 'Something went wrong while unliking this post.',
    defaultMessage: 'Something went wrong while unliking this post.',
  },
});

const dateFormat = { year: 'numeric', month: '2-digit', day: '2-digit' };

// I will remove it once I update the useLiveData function of VLT.
function useLiveData(field) {
  const formData = useSelector((state) => state.form.global?.[field]);
  return formData;
}

// Remove once we merged the pr in volto for the same changes.
const useUser = () => {
  const users = useSelector((state) => state.users);
  const user = users?.user;
  const userId = useSelector((state) =>
    state.userSession.token ? jwtDecode(state.userSession.token).sub : '',
  );
  const dispatch = useDispatch();

  useEffect(() => {
    // Only added the userId check to avoid infinite loop in anonymous user case.
    if (userId && !user?.id && users?.get.loading === false) {
      dispatch(getUser(userId));
    }
  }, [dispatch, userId, user, users?.get.loading]);

  return user;
};

const ContentInteractions = (props) => {
  const location = useLocation();
  const content = useSelector((state) => state.content.data);
  const site = useSelector((state) => state.site.data);
  const enableContentRating = site['kitconcept.intranet.enable_content_rating'];
  const pathname = location.pathname;
  const allow_discussion =
    useLiveData('allow_discussion') || content?.allow_discussion;
  const enable_likes = useLiveData('enable_likes') ?? content?.enable_likes;
  const votes = content?.votes;
  const loggedIn = useSelector((state) => state.userSession.token, shallowEqual)
    ? true
    : false;
  const link = content['@id'];
  const user = useUser();
  const intl = useIntl();
  const flattenPathname = flattenToAppURL(pathname);
  const dispatch = useDispatch();
  const comment_count = useSelector(
    (state) => state.comments.items_total,
    shallowEqual,
  );
  const [amount, setAmount] = useState(votes ? parseInt(votes.length) : 0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (loggedIn && votes?.length > 0 && user) {
      setLiked(votes.includes(user.username));
    }
  }, [loggedIn, votes, user, setLiked]);

  useEffect(() => {
    if (votes?.length > 0) {
      setAmount(parseInt(votes.length));
    } else {
      setAmount(0);
      setLiked(false);
    }
  }, [votes]);

  const subject = encodeURIComponent(intl.formatMessage(messages.shareSubject));
  const body = encodeURIComponent(`${intl.formatMessage(messages.share)}
${content?.title}
${link}`);
  const mailtoLink = `mailto:?body=${body}&subject=${subject}`;

  const onLike = () => {
    if (liked) {
      dispatch(toggleLike(flattenPathname))
        .then((resp) => {
          if (resp) {
            setLiked(false);
            setAmount(amount - 1);
          }
        })
        .catch((error) => {
          toast.error(
            <Toast error title={intl.formatMessage(messages.unlikeFailed)} />,
          );
        });
    } else {
      dispatch(toggleLike(flattenPathname))
        .then((resp) => {
          if (resp) {
            setLiked(true);
            setAmount(amount + 1);
          }
        })
        .catch((error) => {
          toast.error(
            <Toast error title={intl.formatMessage(messages.likeFailed)} />,
          );
        });
    }
  };

  return (
    <Container className="content-engagement">
      <div className="engagement-container">
        <div className="engagement-section">
          {enableContentRating && enable_likes && (
            <div className={cx('likes-section', { anon: !loggedIn })}>
              {loggedIn ? (
                <Button aria-label="liked" onClick={() => onLike()}>
                  <div className="icon-wrapper">
                    {liked ? (
                      <Icon
                        name={thumbsFilledSVG}
                        size="33px"
                        className="liked"
                      />
                    ) : (
                      <Icon name={thumbsSVG} size="33px" />
                    )}
                  </div>
                </Button>
              ) : (
                <Link
                  aria-label="unliked"
                  to={`${pathname}/login`}
                  title={intl.formatMessage(messages.loginToLike)}
                >
                  <div className="icon-wrapper">
                    <Icon name={thumbsSVG} size="33px" />
                  </div>
                </Link>
              )}
              <div className="likes-count">
                <span>({amount})</span>
              </div>
            </div>
          )}
          {(allow_discussion || comment_count > 0) && (
            <div className="comments-section">
              <Button aria-label="comments">
                <div className="icon-wrapper">
                  <Icon name={commentSVG} size="33px" />
                </div>
              </Button>
              <div className="comments-count">
                <span>({comment_count ? comment_count : 0})</span>
              </div>
            </div>
          )}
          <div className="shares-section">
            <a
              href={mailtoLink}
              title={intl.formatMessage(messages.shareTitle)}
            >
              <Button aria-label="share">
                <Icon name={shareSVG} size="33px" />
              </Button>
            </a>
          </div>
        </div>
        <div className="content-metadata">
          <span className="created">
            {intl.formatMessage(messages.created)}
            <FormattedDate
              className="created-date"
              date={content?.created}
              locale={intl.locale}
              format={dateFormat}
            />
          </span>
          <span className="modified">
            {intl.formatMessage(messages.modified)}
            <FormattedDate
              className="modified-date"
              date={content?.modified}
              locale={intl.locale}
              format={dateFormat}
            />
          </span>
        </div>
      </div>
    </Container>
  );
};

export default ContentInteractions;
