import { useEffect, useState } from 'react';
import { Button, Container } from '@plone/components';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import cx from 'classnames';
import { defineMessages, useIntl } from 'react-intl';
import { getLikes, addLike, removeLike } from '../../actions/likes/likes';
import { getUser } from '@plone/volto/actions/users/users';
import thumbsSVG from '../../icons/icon-thumbs.svg';
import thumbsFilledSVG from '../../icons/icon-thumbs-filled.svg';

const messages = defineMessages({
  loginToLike: {
    id: 'To submit a Like you must be logged in',
    defaultMessage: 'To submit a Like you must be logged in',
  },
});

const Likes = (props) => {
  const { pathname, loggedIn, votes, user } = props;
  const intl = useIntl();
  const [loop, setLoop] = useState(false);
  const [amount, setAmount] = useState(votes ? parseInt(votes.length) : 0);
  const dispatch = useDispatch();
  const [liked, setLiked] = useState(
    loggedIn && votes && votes.length > 0 ? votes.includes(user) : false,
  );

  useEffect(() => {
    setLoop(false);
    dispatch(getLikes(flattenToAppURL(pathname))).then((resp) => {
      if (resp) {
        setAmount(parseInt(resp));
      }
    });
    dispatch(getUser(user)).then((resp) => {
      if (!votes) {
        setLiked(false);
      } else {
        if (resp && resp.username && votes.includes(resp.username)) {
          setLiked(true);
        } else {
          setLiked(false);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [votes]);

  const onLike = () => {
    if (!loop) {
      if (votes && votes.length !== 0 && votes.includes(user)) {
        dispatch(removeLike(flattenToAppURL(pathname))).then((resp) => {
          if (resp) {
            setLiked(false);
            setAmount(amount - 1);
            setLoop(true);
          }
        });
      } else {
        dispatch(addLike(flattenToAppURL(pathname))).then((resp) => {
          if (resp) {
            setLiked(true);
            setAmount(amount + 1);
            setLoop(true);
          }
        });
      }
    } else {
      if (liked) {
        dispatch(removeLike(flattenToAppURL(pathname))).then((resp) => {
          if (resp) {
            setLiked(false);
            setAmount(amount - 1);
          }
        });
      } else {
        dispatch(addLike(flattenToAppURL(pathname))).then((resp) => {
          if (resp) {
            setLiked(true);
            setAmount(amount + 1);
          }
        });
      }
    }
  };

  return (
    <Container className="line">
      <div className="likes">
        <div className={cx('likeamount', { anon: !loggedIn })}>
          {loggedIn ? (
            <Button onClick={() => onLike()}>
              <div className="icon-wrapper">
                {liked ? (
                  <Icon name={thumbsFilledSVG} size="33px" className="liked" />
                ) : (
                  <Icon name={thumbsSVG} size="33px" />
                )}
              </div>
            </Button>
          ) : (
            <Button
              as={Link}
              to={`${pathname}/login`}
              title={intl.formatMessage(messages.loginToLike)}
            >
              <div className="icon-wrapper">
                <Icon name={thumbsSVG} size="33px" />
              </div>
            </Button>
          )}
          <div className="text">
            <span>({amount})</span>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Likes;
