import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import Icon from '@plone/volto/components/theme/Icon/Icon';
import FormattedDate from '@plone/volto/components/theme/FormattedDate/FormattedDate';
import { usePrevious } from '@plone/volto/helpers/Utils/usePrevious';
import warningSVG from '@plone/volto/icons/warning.svg';
import { getService } from '@kitconcept/intranet/actions/getService/getService';

const MaintenanceBanner = () => {
  const [banner, setBanner] = useState({});
  const dispatch = useDispatch();
  const pathname = useLocation().pathname;
  const previousPathname = usePrevious(pathname);

  // fetch on first load and when leaving the maintenance-banner controlpanel
  useEffect(() => {
    if (
      pathname !== previousPathname &&
      [undefined, '/controlpanel/maintenance-banner'].includes(previousPathname)
    )
      dispatch(getService('/@maintenance-banner'))
        .then((banner) => setBanner(banner))
        .catch(() => setBanner({}));
  }, [dispatch, pathname, previousPathname]);

  const { show_banner, banner_title, banner_text, date } = banner;
  return show_banner ? (
    <aside className="maintenance-banner" role="alert">
      <header>
        <Icon name={warningSVG} size="48px" />
        <div className="maintenance-banner-title">{banner_title}</div>
      </header>
      <section>
        {date ? (
          <div className="maintenance-banner-date">
            <FormattedDate
              date={`${date}T00:00`}
              format={{
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }}
            />
          </div>
        ) : null}
        {banner_text?.data ? (
          <div dangerouslySetInnerHTML={{ __html: banner_text.data }} />
        ) : null}
      </section>
    </aside>
  ) : null;
};

export default MaintenanceBanner;
