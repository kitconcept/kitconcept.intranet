import { Button, Container } from '@plone/components';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import useUser from '@plone/volto/hooks/user/useUser';
import cx from 'classnames';
import { defineMessages, useIntl } from 'react-intl';
import { getLikes, addLike, removeLike } from '../../actions/likes/likes';
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
  const { pathname, loggedIn, allow_discussion, votes } = props;
  const link = props.link;
  const user = useUser();
  const intl = useIntl();
  const flattenPathname = flattenToAppURL(pathname);
  const dispatch = useDispatch();
  const content = useSelector((state) => state.content);
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

  const deBody = `Sehr%20geehrte/r,%0D%0A%0D%0AIch%20möchte%20folgende%20Meldung%20mit%20Ihnen%20teilen:%0D%0A%0D%0A${link}%0D%0A%0D%0AMit%20freundlichen%20Grüßen%0D%0A${
    user.fullname ? user.fullname : ''
  }`;

  const enBody = `Dear,%0D%0A%0D%0AI%20would%20like%20to%20share%20the%20following%20News%20with%20you:%0D%0A%0D%0A${link}%0D%0A%0D%0AKind%20regards%0D%0A${
    user.fullname ? user.fullname : ''
  }`;

  const deMailTo = `mailto:?body=${deBody}&subject=Intranet-Lesetipp`;
  const enMailTo = `mailto:?body=${enBody}&subject=Intranet%20reading%20tip`;

  const onLike = () => {
    if (liked) {
      dispatch(removeLike(flattenPathname)).then((resp) => {
        if (resp) {
          setLiked(false);
          setAmount(amount - 1);
        }
      });
    } else {
      dispatch(addLike(flattenPathname)).then((resp) => {
        if (resp) {
          setLiked(true);
          setAmount(amount + 1);
        }
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
              <Button
                aria-label="unliked"
                as={Link}
                to={`${pathname}/login`}
                title={intl.formatMessage(messages.loginToLike)}
              >
                <div className="icon-wrapper">
                  <Icon name={thumbsSVG} size="33px" />
                </div>
              </Button>
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
              date={content?.data?.created}
              locale={intl.locale}
            />
          </span>
          <span className="modified">
            {intl.formatMessage(messages.modified)}
            <DotFormattedDate
              className="modified-date"
              date={content?.data?.modified}
              locale={intl.locale}
            />
          </span>
        </div>
      </div>
    </Container>
  );
};

export default Rating;
