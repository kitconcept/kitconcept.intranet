import Helmet from '@plone/volto/helpers/Helmet/Helmet';
import { useSelector } from 'react-redux';
import type { GetSiteResponse } from '@plone/types';
import BodyClass from '@plone/volto/helpers/BodyClass/BodyClass';

type FormState = {
  site: { data: GetSiteResponse };
};

const IntranetCSSInjector = () => {
  const site = useSelector<FormState, GetSiteResponse>(
    (state) => state.site.data,
  );
  const personPictureAspectRatio =
    site['kitconcept.person_picture_aspect_ratio'];

  return (
    <>
      {personPictureAspectRatio === 'squared4to5' ? (
        <BodyClass className="person-squared-images" />
      ) : null}
    </>
  );
};

export default IntranetCSSInjector;
