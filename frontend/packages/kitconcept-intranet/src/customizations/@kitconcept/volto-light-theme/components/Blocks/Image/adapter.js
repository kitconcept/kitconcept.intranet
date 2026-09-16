/**
 * OVERRIDE: adapter.js
 * REASON: Adjust floating images to use default width
 * DATE: 2026-09-16
 * DEVELOPER: @TimoBroeskamp
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
