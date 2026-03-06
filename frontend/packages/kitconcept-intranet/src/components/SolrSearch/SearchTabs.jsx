import { useIntl } from 'react-intl';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import config from '@plone/volto/registry';
import stateSVG from '@plone/volto/icons/state.svg';
const iconMapping = {
  Pages: 'Document',
  Events: 'Event',
  Files: 'File',
  Images: 'Image',
  'News Items': 'News Item',
  Persons: 'Person',
};

const SearchTabs = ({ groupSelect, setGroupSelect, facetGroups }) => {
  facetGroups = facetGroups || [];
  const intl = useIntl();

  return (
    <div className="searchTabs ui top attached tabular menu">
      {facetGroups.map(([label, counter], index) => {
        const isActive = index === groupSelect;
        const hasResults = counter;
        return (
          <span
            onClick={() => hasResults && setGroupSelect(index)}
            onKeyDown={() => hasResults && setGroupSelect(index)}
            role="button"
            tabIndex={index}
            key={index}
            className={
              'searchTab item' +
              (isActive ? ' active' : ' inactive') +
              (hasResults ? ' results' : ' noresults')
            }
          >
            <Icon
              className="itemIcon"
              size="24px"
              name={
                config.settings.contentIcons[iconMapping[label]] || stateSVG
              }
            />
            <span>
              {intl.formatMessage({ id: label, defaultMessage: label })}
              <span className={'searchCounter ui circular label'}>
                {hasResults ? counter : '0'}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default SearchTabs;
