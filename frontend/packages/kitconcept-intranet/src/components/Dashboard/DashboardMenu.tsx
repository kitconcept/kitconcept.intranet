import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import rightArrowSVG from '@plone/volto/icons/right-key.svg';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Plug } from '@plone/volto/components/manage/Pluggable';
import { searchContent } from '@plone/volto/actions/search/search';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';

const SUBREQUEST = 'intranet-dashboard-person';

/** Link the current user's Person dashboard from the personal tools menu. */
export default function DashboardMenu() {
  const dispatch = useDispatch();
  // PersonalTools fetches the logged-in user into `state.users.user`.
  const userId = useSelector((state: any) => state.users?.user?.id);
  const personUrl = useSelector(
    (state: any) =>
      state.search?.subrequests?.[SUBREQUEST]?.items?.[0]?.['@id'],
  );

  useEffect(() => {
    if (userId) {
      dispatch(
        searchContent(
          '',
          { portal_type: 'Person', username: userId, b_size: 1 },
          SUBREQUEST,
        ),
      );
    }
  }, [dispatch, userId]);

  if (!personUrl) return null;

  return (
    <Plug
      pluggable="toolbar-user-menu"
      id="intranet-dashboard"
      dependencies={[personUrl]}
    >
      <li>
        <Link to={`${flattenToAppURL(personUrl)}/dashboard`}>
          <FormattedMessage id="Dashboard" defaultMessage="Dashboard" />
          <Icon name={rightArrowSVG} size="24px" />
        </Link>
      </li>
    </Plug>
  );
}
