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
  const bodyClassnames = site['kitconcept.body_classnames'];

  return (
    <>
      {customCSS ? (
        <>
          <Helmet>
            <style>{customCSS}</style>
          </Helmet>
        </>
      ) : null}
      {bodyClassnames ? <BodyClass className={bodyClassnames} /> : null}
    </>
  );
};

export default CustomCSS;
