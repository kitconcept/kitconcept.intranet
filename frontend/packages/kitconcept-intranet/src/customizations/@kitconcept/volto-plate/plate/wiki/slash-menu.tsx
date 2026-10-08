/**
 * OVERRIDE slash-menu.tsx
 * REASON: The "Table" entry inserts a 3 × 3 table with a header row
 *         (Confluence default) instead of Plate's 2 × 2 without header.
 *         Everything else is unchanged.
 * FILE: https://github.com/kitconcept/volto-plate/blob/1.0.0a36/frontend/packages/volto-plate/src/plate/wiki/slash-menu.tsx
 * FILE VERSION: @kitconcept/volto-plate 1.0.0-alpha.36
 * DATE: 2026-10-08
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 * CHANGELOG:
 *  - Merge volto-plate 1.0.0-alpha.33: add the "Diagram" entry to the
 *    "Advanced blocks" group. @sneridagh
 *  - Merge volto-plate 1.0.0-alpha.35: filter out the toggle entry, the
 *    toggle plugin is not part of the wiki editor preset. @sneridagh
 *  - Merge volto-plate 1.0.0-alpha.36: translated "Image" and "Diagram"
 *    entries; `extendGroups` arguments are passed on to the upstream
 *    menu. @sneridagh
 */

import type {
  SlashMenuConfig,
  SlashMenuGroup,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { CODE_DRAWING_KEY, insertCodeDrawing } from '@platejs/code-drawing';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { ImageIcon, WorkflowIcon } from 'lucide-react';
import { KEYS, PathApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import { defineMessages } from 'react-intl';
import { insertWikiTable } from '@kitconcept/intranet/components/WikiTable/insertWikiTable';

import {
  fallbackTranslate,
  type TranslateFunction,
} from '@plone/plate/components/editor/plugins/i18n';

const messages = defineMessages({
  diagram: { id: 'Diagram', defaultMessage: 'Diagram' },
  image: { id: 'Image', defaultMessage: 'Image' },
});

const insertPloneBlock = (editor: PlateEditor, blockType: string) => {
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();
    if (!block) return;

    editor.tf.insertNodes(
      editor.api.create.block({
        type: PLONE_BLOCK_TYPE,
        '@type': blockType,
      }),
      {
        at: PathApi.next(block[1]),
        select: true,
      },
    );

    if (block[0].type !== PLONE_BLOCK_TYPE) {
      editor.tf.removeNodes({ previousEmptyBlock: true });
    }
  });
};

const IMAGE_SLASH_VALUE = 'block_plateimage';

const createImageSlashItem = (t: TranslateFunction) => ({
  icon: <ImageIcon />,
  keywords: ['image', 'media', 'photo', 'picture'],
  label: t(messages.image.id, { defaultValue: messages.image.defaultMessage }),
  value: IMAGE_SLASH_VALUE,
  onSelect: (editor: PlateEditor) => {
    insertPloneBlock(editor, 'plateimage');
  },
});

const insertDiagram = (editor: PlateEditor) => {
  editor.tf.withoutNormalizing(() => {
    const block = editor.api.block();
    if (!block) return;

    insertCodeDrawing(
      editor,
      {},
      { at: PathApi.next(block[1]), nextBlock: false, select: true },
    );

    if (block[0].type !== CODE_DRAWING_KEY) {
      editor.tf.removeNodes({ previousEmptyBlock: true });
    }
  });
};

const createDiagramSlashItem = (t: TranslateFunction) => ({
  icon: <WorkflowIcon />,
  keywords: ['diagram', 'drawing', 'mermaid', 'plantuml', 'graphviz', 'chart'],
  label: t(messages.diagram.id, {
    defaultValue: messages.diagram.defaultMessage,
  }),
  value: CODE_DRAWING_KEY,
  onSelect: insertDiagram,
});

// OVERRIDE: not exported, wrapped below.
const baseSlashMenu: SlashMenuConfig = {
  extendGroups: (groups, _editor, { t = fallbackTranslate }) =>
    groups
      // The toggle plugin is not part of the wiki editor preset.
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => item.value !== KEYS.toggle),
      }))
      .map((group) => {
        if (group.group === 'Actions') {
          return {
            ...group,
            items: group.items.filter((item) => item.value !== 'AI'),
          };
        }

        if (group.group === 'Blocks') {
          return null;
        }

        if (group.group === 'Text blocks') {
          if (group.items.some((item) => item.value === IMAGE_SLASH_VALUE)) {
            return group;
          }

          const paragraphIndex = group.items.findIndex(
            (item) => item.value === 'p',
          );

          return {
            ...group,
            items:
              paragraphIndex === -1
                ? [...group.items, createImageSlashItem(t)]
                : [
                    ...group.items.slice(0, paragraphIndex + 1),
                    createImageSlashItem(t),
                    ...group.items.slice(paragraphIndex + 1),
                  ],
          };
        }

        if (
          group.group === 'Advanced blocks' &&
          !group.items.some((item) => item.value === CODE_DRAWING_KEY)
        ) {
          return {
            ...group,
            items: [...group.items, createDiagramSlashItem(t)],
          };
        }

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};

// OVERRIDE: the "Table" entry inserts a 3 × 3 table with a header row.
export const slashMenu: SlashMenuConfig = {
  ...baseSlashMenu,
  extendGroups: (groups, editor, options) =>
    (baseSlashMenu.extendGroups?.(groups, editor, options) ?? groups).map(
      (group) => ({
        ...group,
        items: group.items.map((item) =>
          item.value === KEYS.table
            ? { ...item, onSelect: (editor) => insertWikiTable(editor) }
            : item,
        ),
      }),
    ),
};
