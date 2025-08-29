import Helmet from '@plone/volto/helpers/Helmet/Helmet';
import { useSelector } from 'react-redux';
import type { GetSiteResponse } from '@plone/types';
import BodyClass from '@plone/volto/helpers/BodyClass/BodyClass';

type FormState = {
  site: { data: GetSiteResponse };
};

const CustomCSS = () => {
  const site = useSelector<FormState, GetSiteResponse>(
    (state) => state.site.data,
  );
  const customCSS = site['kitconcept.intranet.custom_css'];
  const personSquaredImages = site['kitconcept.person_squared_images'];

  return (
    <>
      {customCSS ? (
        <>
          <Helmet>
            <style>{customCSS}</style>
          </Helmet>
        </>
      ) : null}
      {personSquaredImages === 'squared4to5' ? (
        <BodyClass className="person-squared-images" />
      ) : null}
    </>
  );
};

export default CustomCSS;
