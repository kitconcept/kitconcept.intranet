import Icon from '@plone/volto/components/theme/Icon/Icon';
import rightArrowSVG from '@plone/volto/icons/right-key.svg';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Plug } from '@plone/volto/components/manage/Pluggable';

/** "Notifications" entry in the toolbar's personal menu. */
export default function NotificationsMenu() {
  return (
    <Plug pluggable="toolbar-user-menu" id="intranet-notifications">
      <li>
        <Link to="/notifications">
          <FormattedMessage id="Notifications" defaultMessage="Notifications" />
          <Icon name={rightArrowSVG} size="24px" />
        </Link>
      </li>
    </Plug>
  );
}
