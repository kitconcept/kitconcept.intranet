import type { Content } from '@plone/types';
import RelatedItems from '@plone/volto/components/theme/RelatedItems/RelatedItems';

// Wraps Volto's RelatedItems in its own query container, so its margins can
// follow the content area width via @container (see theme/slots.scss).
const RelatedItemsSlot = ({ content }: { content: Content }) =>
  content?.relatedItems?.length ? (
    <div className="related-items-container">
      <RelatedItems content={content} />
    </div>
  ) : null;

export default RelatedItemsSlot;
