import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import ResultItemPreviewImage from '@kitconcept/volto-solr/components/theme/SolrSearch/resultItems/helpers/ResultItemPreviewImage';
import phoneSVG from '@kitconcept/volto-solr/components/theme/SolrSearch/icons/phone.svg';
import emailSVG from '@plone/volto/icons/email.svg';
import locationSVG from '@kitconcept/volto-solr/components/theme/SolrSearch/icons/location.svg';
import fallbackAvatarSVG from '@kitconcept/volto-solr/components/theme/SolrSearch/icons/fallback-avatar.svg';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import config from '@plone/volto/registry';
import MaybeWrap from '@plone/volto/components/manage/MaybeWrap/MaybeWrap';

const PersonResultItem = ({ item }) => {
  const site = useSelector((state) => state.site?.data);
  const hideProfileLinks = site?.['kitconcept.disable_profile_links'];

  return (
    <article className="tileItem personResultItem">
      <div className="itemWrapper">
        <div className="itemImageWrapper">
          <MaybeWrap
            condition={!hideProfileLinks}
            as={Link}
            to={item['@id']}
          >
            <Icon
              size="64px"
              name={fallbackAvatarSVG}
              color={config.settings.baseColor}
            />
            <ResultItemPreviewImage
              Wrapper={null}
              className="profileImage"
              item={item}
              width="64"
              height="64"
            />
          </MaybeWrap>
        </div>
        <div className="itemContent">
          <p className="url">{item['@id']}</p>
          <h2 className="tileHeadline">
            <MaybeWrap
              condition={!hideProfileLinks}
              as={Link}
              to={item['@id']}
              className="summary url"
              title={item['@type']}
            >
              {item.title}
            </MaybeWrap>
          </h2>
          {item.extras.job_title && (
            <p className="jobTitle">{item.extras.job_title}</p>
          )}
          <div className="tileFooter">
            {item.extras.contact_phone && (
              <span className="itemPhone itemField">
                <Icon className="itemIcon" size="20px" name={phoneSVG} />
                {item.extras.contact_phone}
              </span>
            )}
            {item.extras.contact_building && (
              <span className="itemBuilding itemField">
                <Icon className="itemIcon" size="20px" name={locationSVG} />
                {item.extras.contact_building}
                {item.extras.contact_room && (
                  <span>
                    {', '}
                    {item.extras.contact_room}
                  </span>
                )}
              </span>
            )}
            {item.extras.contact_email && (
              <span className="itemEmail itemField">
                <Icon className="itemIcon" size="20px" name={emailSVG} />
                {item.extras.contact_email}
              </span>
            )}
          </div>
        </div>
        <div className="visualClear" />
      </div>
    </article>
  );
};

export default PersonResultItem;
