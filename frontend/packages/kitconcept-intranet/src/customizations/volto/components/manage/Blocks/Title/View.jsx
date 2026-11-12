/**
 * OVERRIDE View.jsx
 * REASON: Add a slot below the title block.
 * FILE: https://github.com/plone/volto/blob/18.36.0/packages/volto/src/components/manage/Blocks/Title/View.jsx
 * FILE VERSION: Volto 18.36.0
 * PULL REQUEST: https://github.com/kitconcept/kitconcept.intranet/pull/131
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/issues/19
 * DATE: 2025-07-29
 * DEVELOPER: @Tishasoumya-02
 * CHANGELOG:
 *  - Add documentByLine feature. @Tishasoumya-02
 *  - Sync with Volto 18.36.0. @sneridagh
 */

import { useSelector, shallowEqual } from 'react-redux';
import SlotRenderer from '@plone/volto/components/theme/SlotRenderer/SlotRenderer';

const TitleBlockView = ({ properties, metadata }) => {
  const content = useSelector((state) => state.content.data, shallowEqual);
  return (
    <>
      <h1 className="documentFirstHeading">
        {(metadata || properties)['title'] || ''}
      </h1>
      {/* START CUSTOMIZATION */}
      <SlotRenderer name="belowContentTitle" content={content} />
      {/* END CUSTOMIZATION */}
    </>
  );
};

export default TitleBlockView;
