/**
 * OVERRIDE: adapter.js
 * REASON: Adjust floating images to use default width
 * DATE: 2026-09-16
 * DEVELOPER: @TimoBroeskamp
 * FILE: https://github.com/kitconcept/volto-light-theme/blob/8.0.0a32/packages/volto-light-theme/src/components/Blocks/Image/adapter.js
 * FILE VERSION: VLT 8.0.0a32
 * PULL REQUEST: https://github.com/kitconcept/kitconcept.intranet/pull/504
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/351
 */

export const ImageBlockDataAdapter = ({
  block,
  data,
  id,
  item,
  onChangeBlock,
  value,
}) => {
  let dataSaved = {
    ...data,
    [id]: value,
  };

  const align = dataSaved.styles?.['align:noprefix'];
  const isFloating = align === 'left' || align === 'right';

  if (!isFloating) {
    dataSaved = {
      ...dataSaved,
      styles: {
        ...dataSaved.styles,
        'size:noprefix': 'l',
      },
    };
  }

  if (isFloating) {
    dataSaved = {
      ...dataSaved,
      styles: {
        ...dataSaved.styles,
        'blockWidth:noprefix': 'default',
      },
    };
  }

  if (id === 'url') {
    if (value) {
      dataSaved = {
        ...dataSaved,
        credit: { data: item?.credit },
        description: item?.Description,
        title: item?.Title,
        image_field: item?.image_field,
        image_scales: item?.image_scales,
      };
    } else {
      [
        'alt',
        'credit',
        'description',
        'image_scales',
        'image_field',
        'title',
      ].forEach((id) => delete dataSaved[id]);
    }
  }
  onChangeBlock(block, dataSaved);
};
