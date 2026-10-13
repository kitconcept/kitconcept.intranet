import React from 'react';
import { useSelector } from 'react-redux';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import rightArrowSVG from '@plone/volto/icons/right-key.svg';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Plug } from '@plone/volto/components/manage/Pluggable';

/** Link the current user's personal dashboard from the personal tools menu. */
export default function DashboardMenu() {
  // PersonalTools fetches the logged-in user into `state.users.user`.
  const userId = useSelector((state: any) => state.users?.user?.id);

  if (!userId) return null;

  return (
    <Plug
      pluggable="toolbar-user-menu"
      id="intranet-dashboard"
      dependencies={[userId]}
    >
      <li>
        <Link to={`/${userId}/dashboard`}>
          <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
          <Icon name={rightArrowSVG} size="24px" />
        </Link>
      </li>
    </Plug>
  );
}
