import { Button, Container } from '@plone/components';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import cx from 'classnames';
import { defineMessages, useIntl } from 'react-intl';
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

const Rating = (props) => {
  const { pathname, loggedIn, allow_discussion, comments } = props;
  const intl = useIntl();
  const content = useSelector((state) => state.content);
  const liked = false;
  const amount = 0;
  // const [loop, setLoop] = useState(false);
  // const [amount, setAmount] = useState(votes ? parseInt(votes.length) : 0);

  // const dispatch = useDispatch();
  // const [liked, setLiked] = useState(
  //   loggedIn && votes && votes.length > 0 ? votes.includes(user) : false,
  // );
  // const link = props.link.replace('/api', '');
  // const userData = useSelector((state) => state.users.user);

  // useEffect(() => {
  //   setLoop(false);
  //   dispatch(getLikes(flattenToAppURL(pathname))).then((resp) => {
  //     if (resp) {
  //       setAmount(parseInt(resp));
  //     }
  //   });
  //   dispatch(getUser(user)).then((resp) => {
  //     if (!votes) {
  //       setLiked(false);
  //     } else {
  //       if (resp && resp.username && votes.includes(resp.username)) {
  //         setLiked(true);
  //       } else {
  //         setLiked(false);
  //       }
  //     }
  //   });
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [votes]);

  // const deBody = `Sehr%20geehrte/r,%0D%0A%0D%0AIch%20möchte%20folgende%20Meldung%20mit%20Ihnen%20teilen:%0D%0A%0D%0A${link}%0D%0A%0D%0AMit%20freundlichen%20Grüßen%0D%0A${
  //   userData.fullname ? userData.fullname : ''
  // }`;

  // const enBody = `Dear,%0D%0A%0D%0AI%20would%20like%20to%20share%20the%20following%20News%20with%20you:%0D%0A%0D%0A${link}%0D%0A%0D%0AKind%20regards%0D%0A${
  //   userData.fullname ? userData.fullname : ''
  // }`;

  // const deMailTo = `mailto:?body=${deBody}&subject=Intranet-Lesetipp`;
  // const enMailTo = `mailto:?body=${enBody}&subject=Intranet%20reading%20tip`;

  // const onLike = () => {
  //   if (!loop) {
  //     if (votes && votes.length !== 0 && votes.includes(user)) {
  //       dispatch(removeLike(flattenToAppURL(pathname))).then((resp) => {
  //         if (resp) {
  //           setLiked(false);
  //           setAmount(amount - 1);
  //           setLoop(true);
  //         }
  //       });
  //     } else {
  //       dispatch(addLike(flattenToAppURL(pathname))).then((resp) => {
  //         if (resp) {
  //           setLiked(true);
  //           setAmount(amount + 1);
  //           setLoop(true);
  //         }
  //       });
  //     }
  //   } else {
  //     if (liked) {
  //       dispatch(removeLike(flattenToAppURL(pathname))).then((resp) => {
  //         if (resp) {
  //           setLiked(false);
  //           setAmount(amount - 1);
  //         }
  //       });
  //     } else {
  //       dispatch(addLike(flattenToAppURL(pathname))).then((resp) => {
  //         if (resp) {
  //           setLiked(true);
  //           setAmount(amount + 1);
  //         }
  //       });
  //     }
  //   }
  // };

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
  return (
    <Container className="content-engagement">
      <div className="engagement-container">
        <div className="engagement-section">
          <div className={cx('likes-section', { anon: !loggedIn })}>
            {loggedIn ? (
              <Button>
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
          {(allow_discussion || comments >= 0) && (
            <div className="comments-section">
              <Button>
                <div className="icon-wrapper">
                  <Icon name={commentSVG} size="33px" />
                </div>
              </Button>
              <div className="comments-count">
                <span>({comments ? comments : 0})</span>
              </div>
            </div>
          )}
          <div className="shares-section">
            {/* <a href={intl.locale === 'de' ? deMailTo : enMailTo}> */}
            <Button className="icon-wrapper">
              <Icon name={shareSVG} size="33px" />
            </Button>
            {/* </a> */}
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
