import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import HeaderSearch from './HeaderSearch';
import cx from 'classnames';

import VLTHeader from 'altVLT/components/Header/Header';

type HeaderState = {
  content: {
    data?: {
      '@components'?: {
        inherit?: {
          'kitconcept.plate.workspace'?: {
            from?: {
              '@id'?: string;
            };
          };
        };
      };
    };
    loading?: boolean;
  };
};

const Header = (props) => {
  const { pathname } = props;
  const isWorkspace = useSelector((state: HeaderState) =>
    Boolean(
      state.content.data?.['@components']?.['inherit']?.[
        'kitconcept.plate.workspace'
      ]?.['from']?.['@id'],
    ),
  );
  const loading = useSelector(
    (state: HeaderState) => state.content.loading ?? false,
  );
  const [stableIsWorkspace, setStableIsWorkspace] = useState(isWorkspace);
  const [isRouteTransition, setIsRouteTransition] = useState(false);

  useEffect(() => {
    if (!loading) {
      setStableIsWorkspace(isWorkspace);
    }
  }, [isWorkspace, loading]);

  useEffect(() => {
    if (!stableIsWorkspace) {
      return;
    }

    setIsRouteTransition(true);
    const timeout = window.setTimeout(() => {
      setIsRouteTransition(false);
    }, 280);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pathname, stableIsWorkspace]);

  if (!stableIsWorkspace) {
    return <VLTHeader {...props} />;
  }

  return (
    <div className="header-intranet-compact-wrapper">
      <div
        className={cx('header-intranet-compact', {
          'is-route-transition': isRouteTransition,
        })}
      >
        <HeaderSearch />
      </div>
      <div className="pusher"></div>
    </div>
  );
};

export default Header;
