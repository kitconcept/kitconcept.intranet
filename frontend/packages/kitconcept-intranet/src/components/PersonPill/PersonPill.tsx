import { useState } from 'react';
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
  background?: boolean;
  role?: string;
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
  background = false,
  role,
  subheading,
}: PersonPillProps) => {
  const showProfileLinks = useSelector(
    (state: SiteState) =>
      !state.site?.data?.['kitconcept.clickable_profile_links'],
  );

  const portraitSrc =
    portrait ?? (id ? expandToBackendURL(`@portrait/${id}`) : undefined);

  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(portraitSrc) && !imageFailed;

  const avatar = showImage ? (
    <img
      className="person-pill-portrait"
      src={portraitSrc}
      alt={fullname || name}
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

  const label =
    role || subheading ? (
      <span className="person-pill-labels">
        {role ? <span className="person-pill-role">{role}</span> : null}
        <span className="person-pill-name">{fullname || name}</span>
        {subheading ? (
          <span className="person-pill-subheading">{subheading}</span>
        ) : null}
      </span>
    ) : (
      <span className="person-pill-name">{fullname || name}</span>
    );

  const showLink = Boolean(url) && showProfileLinks;

  return (
    <span
      className={cx('person-pill', {
        'person-pill-compact': compact,
        'person-pill-background': background,
        'person-pill-with-role': role,
        'person-pill-with-subheading': subheading,
      })}
    >
      {showLink ? (
        <UniversalLink className="person-pill-link" href={url as string}>
          {avatar}
          {label}
        </UniversalLink>
      ) : (
        <>
          {avatar}
          {label}
        </>
      )}
    </span>
  );
};

export default PersonPill;
