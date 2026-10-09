import Toolbar from '@plone/volto/components/manage/Toolbar/Toolbar';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import { getParentUrl } from '@plone/volto/helpers/Url/Url';
import { useClient } from '@plone/volto/hooks';
import config from '@plone/volto/registry';
import { createPortal } from 'react-dom';
import { defineMessages, useIntl, FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getVocabulary } from '@plone/volto/actions/vocabularies/vocabularies';
import { getTypeSettings } from '@kitconcept/intranet/actions/typeSettings/typeSettings';
import { useDispatch, useSelector } from 'react-redux';
import Error from '@plone/volto/components/theme/Error/Error';
import {
  Checkbox,
  CheckboxGroup,
  Select,
  SelectItem,
  Spinner,
} from '@plone/components';
import UniversalLink from '@plone/volto/components/manage/UniversalLink/UniversalLink';

import backSVG from '@plone/volto/icons/back.svg';

const messages = defineMessages({
  back: {
    id: 'Back',
    defaultMessage: 'Back',
  },
  loading: {
    id: 'loading',
    defaultMessage: 'Loading',
  },
  is_addable: {
    id: 'Global allow',
    defaultMessage: 'Global allow',
  },
  is_discussion_allowed: {
    id: 'Allow discussions',
    defaultMessage: 'Allow discussions',
  },
  is_default_page_type: {
    id: 'Is default page',
    defaultMessage: 'Is default page',
  },
  is_searchable: {
    id: 'Is searchable',
    defaultMessage: 'Is searchable',
  },
  is_redirect_links_enabled: {
    id: 'Redirect links',
    defaultMessage: 'Redirect links',
  },
  versioning_off: {
    id: 'No versioning',
    defaultMessage: 'No versioning',
  },
  versioning_manual: {
    id: 'Manual versioning',
    defaultMessage: 'Manual versioning',
  },
  versioning_automatic: {
    id: 'Automatic versioning',
    defaultMessage: 'Automatic versioning',
  },
});

const TypeSettingsControlpanel = (props) => {
  const { location } = props;
  const intl = useIntl();
  const vocabName = 'plone.app.vocabularies.ReallyUserFriendlyTypes';
  const selectableTypes = useSelector((state) => state.vocabularies[vocabName]);
  const typeSettings = useSelector((state) => state.typeSettings);
  const dispatch = useDispatch();
  const pathname = location.pathname;
  const isClient = useClient();
  const [settings, setSettings] = useState({});
  const booleanKeys = (obj) =>
    Object.keys(obj).filter((key) => typeof obj[key] === 'boolean');

  const keys = booleanKeys(settings);
  const selected = keys.filter((key) => settings[key]);

  const handleChange = (checked) =>
    setSettings((s) => ({
      ...s,
      ...Object.fromEntries(keys.map((key) => [key, checked.includes(key)])),
    }));

  useEffect(() => {
    dispatch(getVocabulary({ vocabNameOrURL: vocabName }));
    if (typeSettings?.items) {
      setSettings(typeSettings.items);
    }
  }, [dispatch, typeSettings]);

  console.log(typeSettings?.items);
  return (
    <div
      id="page-block_types"
      className="ui container controlpanel-block-types"
    >
      <h1>
        <FormattedMessage id="Type Settings" defaultMessage="Type Settings" />
      </h1>
      {selectableTypes?.loaded && (
        <Select
          items={selectableTypes.items}
          onChange={(label) => {
            dispatch(
              getTypeSettings(
                selectableTypes.items.find((x) => x.label === label).value,
              ),
            );
          }}
        />
      )}
      {typeSettings?.loaded && (
        <>
          <CheckboxGroup value={selected} onChange={handleChange}>
            {keys.map((key) => (
              <Checkbox key={key} value={key}>
                {intl.formatMessage(messages[key])}
              </Checkbox>
            ))}
          </CheckboxGroup>
          <Select value={typeSettings.items['current_versioning_policy']}>
            {typeSettings.items['versioning_policies'].map((key) => (
              <SelectItem key={key.id} id={key.id}>
                {intl.formatMessage(messages[key.title])}
              </SelectItem>
            ))}
          </Select>
        </>
      )}
      {isClient &&
        createPortal(
          <Toolbar
            pathname={pathname}
            hideDefaultViewButtons
            inner={
              <Link to={getParentUrl(pathname)} className="item">
                <Icon
                  name={backSVG}
                  className="contents circled"
                  size="30px"
                  title={intl.formatMessage(messages.back)}
                />
              </Link>
            }
          />,
          document.getElementById('toolbar'),
        )}
    </div>
  );
};

export default TypeSettingsControlpanel;
