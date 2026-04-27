---
myst:
  html_meta:
    description: "How to upload files by dragging and dropping them into the folder contents view."
    keywords: "drag and drop, file upload, folder contents, files, how-to, editor"
doc_type: how-to
audience: editor
last_updated: 2026-04-27
---

# Upload files by drag and drop

The folder contents view supports drag-and-drop file uploading. You can drag files directly from your computer's file explorer into the contents table to upload them without using the standard Add menu.

## Prerequisites

- You have Contributor or Editor access to the folder.
- The folder is already created and you are viewing its **Contents** tab.

## Uploading Files by Drag and Drop

1. Navigate to the folder where you want to upload files.
2. Click the **Contents** icon in toolbar action to open the contents view.
3. Open your operating system's file explorer (Finder on macOS, Explorer on Windows) and locate the files you want to upload.
4. Drag one or more files from the file explorer and drop them anywhere onto the contents table.
   - A highlighted drop zone or upload indicator will appear while you are dragging.
5. Release the mouse button to start the upload.
6. A loading indicator will appear while the files are uploading.
7. Once complete, the new file items will appear in the contents list.

:::{note}
The drag-and-drop zone is active across the entire contents table area, not just the header or empty space.
:::

## Supported File Types

All file types that Plone supports as File content items can be uploaded via drag and drop. Common examples include:

- Documents: `.pdf`, `.docx`, `.xlsx`, `.pptx`, `.odt`
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`
- Archives: `.zip`, `.tar.gz`

:::{tip}
Image files (JPEG, PNG, GIF, WebP) are automatically created as **Image** content items. All other files are created as **File** content items. You can change the content type after upload if needed.
:::

## Uploading Multiple Files at Once

You can select and drag multiple files simultaneously:

1. In your file explorer, select multiple files (use Shift+click or Ctrl/Cmd+click).
2. Drag the entire selection to the contents view.
3. All selected files will upload in parallel.

## After Uploading

After upload, each file appears as a new content item in the folder. The item is in **Private** state by default. To make it accessible to other users:

1. Select the file(s) in the contents view.
2. Use the **State** toolbar option to publish or submit for review.

## Troubleshooting

**Nothing happens when I drop files.**
Ensure you are on the **Contents** view of a folder, not the default view or the edit form. Check that you have the necessary permissions to add content to this folder.

**Only some files appear after upload.**
Files that exceed the maximum upload size configured by your administrator will be rejected. Check with your administrator for the size limit.

**The upload spinner spins forever.**
This may indicate a server-side error. Try uploading a single file first to see if the issue is specific to a file, then contact your site administrator.

## See Also

- [How to Import and Export Content](/how-to-guides/settings/import-export)
- [Organising Content](/tutorials/organizing-content)
