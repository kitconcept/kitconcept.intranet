import { Button, Container } from '@plone/components';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import useUser from '@plone/volto/hooks/user/useUser';
import cx from 'classnames';
import { defineMessages, useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import Toast from '@plone/volto/components/manage/Toast/Toast';
import { toogleLike } from '../../actions/likes/likes';
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
      'Dear, I would like to share the following News with you: {link} Kind regards {fullname}',
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
const DotFormattedDate = ({ date, className, locale }) => {
  return (
    <FormattedDate
      className={className}
      date={date}
      format={{
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }}
      locale={locale}
    >
      {(parts) => {
        const day = parts.find((p) => p.type === 'day')?.value;
        const month = parts.find((p) => p.type === 'month')?.value;
        const year = parts.find((p) => p.type === 'year')?.value;
        return `${day}.${month}.${year}`;
      }}
    </FormattedDate>
  );
};
const Rating = (props) => {
  const location = useLocation();
  const content = useSelector((state) => state.content.data);
  const pathname = location.pathname;
  const allow_discussion = content?.allow_discussion;
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

  const encodeBody = encodeURIComponent(
    intl.formatMessage(messages.share, {
      link: link,
      fullname: user.username ? user.username : '',
    }),
  );
  const deSubject = encodeURIComponent('Intranet-Lesetipp');
  const enSubject = encodeURIComponent('Intranet reading tip');
  const deMailTo = `mailto:?body=${encodeBody}&subject=${deSubject}`;
  const enMailTo = `mailto:?body=${encodeBody}&subject=${enSubject}`;

  const onLike = () => {
    if (liked) {
      dispatch(toogleLike(flattenPathname))
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
      dispatch(toogleLike(flattenPathname))
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
          {(allow_discussion || comment_count >= 0) && (
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
            <a href={intl.locale === 'de' ? deMailTo : enMailTo}>
              <Button aria-label="share">
                <Icon name={shareSVG} size="33px" />
              </Button>
            </a>
          </div>
        </div>
        <div className="content-metadata">
          <span className="created">
            {intl.formatMessage(messages.created)}
            <DotFormattedDate
              className="created-date"
              date={content?.created}
              locale={intl.locale}
            />
          </span>
          <span className="modified">
            {intl.formatMessage(messages.modified)}
            <DotFormattedDate
              className="modified-date"
              date={content?.modified}
              locale={intl.locale}
            />
          </span>
        </div>
      </div>
    </Container>
  );
};

export default Rating;
