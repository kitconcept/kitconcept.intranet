/* Customized to backport LinkToItem */

import * as React from 'react';
import type { ObjectBrowserItem } from '@plone/types';
import Card from '@kitconcept/volto-light-theme/primitives/Card/Card';
import { smartTextRenderer } from '@kitconcept/volto-light-theme/helpers/smartText';

export type DefaultSummaryProps = {
  item: Partial<ObjectBrowserItem>;
  LinkToItem?: React.ElementType;
  HeadingTag?: React.ElementType;
  a11yLabelId?: string;
  hide_description?: boolean;
};

export type SummaryComponentType = React.ComponentType<DefaultSummaryProps> & {
  hideLink?: boolean;
};

const DefaultSummary = (props: DefaultSummaryProps) => {
  const { item, HeadingTag = 'h3', a11yLabelId, hide_description } = props;
  // @ts-ignore
  const LinkToItem: React.ElementType = React.useContext(Card.LinkContext);
  return (
    <>
      {item?.head_title && <div className="headline">{item.head_title}</div>}
      <HeadingTag className="title" id={a11yLabelId}>
        <LinkToItem>{item.title ? item.title : item.id}</LinkToItem>
      </HeadingTag>
      {!hide_description && item?.description !== '' && (
        <p className="description">{smartTextRenderer(item.description)}</p>
      )}
    </>
  );
};
DefaultSummary.hideLink = false;

export default DefaultSummary;
