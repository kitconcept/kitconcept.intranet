import React from 'react';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import rightArrowSVG from '@plone/volto/icons/right-key.svg';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Plug } from '@plone/volto/components/manage/Pluggable';

/** Add personal navigation through Volto's existing slot, without a toolbar shadow. */
export default function TasksMenu() {
  return (
    <Plug pluggable="toolbar-user-menu" id="intranet-tasks-view">
      <li>
        <Link to="/tasks">
          <FormattedMessage id="Tasks" defaultMessage="Tasks" />
          <Icon name={rightArrowSVG} size="24px" />
        </Link>
      </li>
    </Plug>
  );
}
