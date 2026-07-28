import { useState } from 'react';
import type { CSSProperties } from 'react';
import { useSelector } from 'react-redux';
import cx from 'classnames';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { expandToBackendURL } from '@plone/volto/helpers/Url/Url';
import personSVG from '@plone/volto/icons/user.svg';

type PersonPillProps = {
  id: string;
  fullname?: string;
  name?: string;
  portrait?: string;
  url?: string;
  compact?: boolean;
  background?: string;
  kicker?: string;
  subheading?: string;
};

type SiteState = {
  site?: { data?: { 'kitconcept.clickable_profile_links'?: boolean } };
};

const PersonPill = ({
  id,
  fullname,
  name,
  portrait,
  url,
  compact = false,
  background,
  kicker,
  subheading,
}: PersonPillProps) => {
  const showProfileLinks = useSelector(
    (state: SiteState) =>
      state.site?.data?.['kitconcept.clickable_profile_links'],
  );

  const displayName = fullname || name;

  const portraitSrc =
    portrait ?? (id ? expandToBackendURL(`@portrait/${id}`) : undefined);

  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(portraitSrc) && !imageFailed;

  const avatar = showImage ? (
    <img
      className="person-pill-portrait"
      src={portraitSrc}
      alt={displayName}
      loading="lazy"
      onError={() => setImageFailed(true)}
    />
  ) : (
    <Icon
      className="person-pill-avatar"
      name={personSVG}
      size={compact ? '24px' : '40px'}
      style={{
        width: compact ? '24px' : '40px',
        height: compact ? '24px' : '40px',
      }}
      ariaHidden
    />
  );

  const label = (
    <span className="person-pill-labels">
      {kicker ? <span className="person-pill-kicker">{kicker}</span> : null}
      <span className="person-pill-name">{displayName}</span>
      {subheading ? (
        <span className="person-pill-subheading">{subheading}</span>
      ) : null}
    </span>
  );

  const content = (
    <>
      {avatar}
      {label}
    </>
  );

  const showLink = Boolean(url) && showProfileLinks;

  return (
    <span
      className={cx('person-pill', {
        'person-pill-compact': compact,
        'person-pill-background': background,
        'person-pill-with-kicker': kicker,
        'person-pill-with-subheading': subheading,
      })}
      style={
        background
          ? ({ '--person-pill-background': background } as CSSProperties)
          : undefined
      }
    >
      {showLink ? (
        <UniversalLink className="person-pill-link" href={url as string}>
          {content}
        </UniversalLink>
      ) : (
        content
      )}
    </span>
  );
};

export default PersonPill;
