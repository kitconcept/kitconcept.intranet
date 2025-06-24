import { useSelector, shallowEqual } from 'react-redux';
import SlotRenderer from '@plone/volto/components/theme/SlotRenderer/SlotRenderer';

const TitleBlockView = ({ properties, metadata }) => {
  const content = useSelector((state) => state.content.data, shallowEqual);
  return (
    <>
      <h1 className="documentFirstHeading">
        {(metadata || properties)['title'] || ''}
      </h1>
      <SlotRenderer name="belowContentTitle" content={content} />
    </>
  );
};

export default TitleBlockView;
