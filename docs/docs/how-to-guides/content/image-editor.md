---
myst:
  html_meta:
    description: "How to edit images directly in the browser using the built-in image editor."
    keywords: "image editor, crop, resize, rotate, image, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-08
---

# Edit images

The kitconcept Intranet includes a built-in image editor (provided by the `@plone-collective/volto-image-editor` add-on). You can crop, rotate, flip, and adjust images directly in the browser without needing external software.

## Prerequisites

- You have Editor or Manager access to the image item.
- The image has been uploaded as an **Image** content item.

## Opening the Image Editor

### From the Image content item

1. Navigate to the Image content item you want to edit.
2. Click **Edit** in the toolbar.
3. In the edit form, locate the image field.
4. Click the **Edit image** button (pencil or crop icon) next to the image preview.
   The image editor will open in a modal overlay.

### From within a block (e.g. Image block)

1. Open the page containing the block in edit mode.
2. Click on the Image block.
3. In the sidebar, click the **Edit image** icon next to the selected image.

## Using the Editor

### Crop

1. Click the **Crop** tool in the editor toolbar.
2. Drag the corner or edge handles on the image to define the crop area.
3. Optionally, select a preset aspect ratio (e.g. **16:9**, **4:3**, **1:1 square**) from the ratio buttons.
4. Click **Apply** to confirm the crop.

:::{tip}
Use the **1:1** ratio preset for person profile photos to ensure consistent square thumbnails across the intranet directory.
:::

### Rotate

- Click the **Rotate left** button to rotate the image 90° counter-clockwise.
- Click the **Rotate right** button to rotate the image 90° clockwise.

### Flip

- Click **Flip horizontal** to mirror the image left-to-right.
- Click **Flip vertical** to mirror the image top-to-bottom.

### Brightness and Contrast

If available in your installation:

1. Click the **Adjust** tab.
2. Drag the **Brightness** slider to lighten or darken the image.
3. Drag the **Contrast** slider to increase or reduce contrast.

## Saving Changes

1. After making all adjustments, click **Save** inside the image editor modal.
2. The edited image replaces the original in the image field.
3. Click **Save** on the content item or page form to persist the changes.

:::{warning}
Saving in the image editor modifies the stored image. The original is not automatically retained. If you need to keep the original, make a copy of the image content item before editing.
:::

## Resetting Changes

If you want to discard your edits and start over:

- Click **Cancel** in the image editor modal to close without saving.
- If you have already saved and want to restore the original, you will need to re-upload the original file.

## Example: Preparing a Person Portrait

1. Upload the portrait photo as an Image content item.
2. Open the edit form and click **Edit image**.
3. Select the **Crop** tool and set the aspect ratio to **1:1**.
4. Drag the crop area to frame the face with a small amount of background space.
5. Click **Apply**, then **Save** in the editor.
6. Save the content item.
7. The square portrait is now ready to use in the Person content item.

## See Also

- [How to Create a Person](/how-to-guides/content/create-person)
- [How to Upload Files by Drag and Drop](/how-to-guides/content/drag-drop-files)
