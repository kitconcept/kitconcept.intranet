/**
 * OVERRIDE slash-menu.tsx
 * REASON: The "Table" entry inserts a 3 × 3 table with a header row
 *         (Confluence default) instead of Plate's 2 × 2 without header.
 *         Everything else is unchanged.
 * FILE: https://github.com/kitconcept/volto-plate/blob/1.0.0a29/frontend/packages/volto-plate/src/plate/wiki/slash-menu.tsx
 * FILE VERSION: @kitconcept/volto-plate 1.0.0-alpha.29
 * DATE: 2026-09-30
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 */

import type {
  SlashMenuConfig,
  SlashMenuGroup,
} from '@plone/plate/components/editor/plugins/slash-menu';
import { PLONE_BLOCK_TYPE } from '@plone/helpers';
import { ImageIcon } from 'lucide-react';
import { KEYS, PathApi } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import { insertWikiTable } from '@kitconcept/intranet/components/WikiTable/insertWikiTable';

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

const IMAGE_SLASH_ITEM = {
  icon: <ImageIcon />,
  keywords: ['image', 'media', 'photo', 'picture'],
  label: 'Image',
  value: 'block_plateimage',
  onSelect: (editor: PlateEditor) => {
    insertPloneBlock(editor, 'plateimage');
  },
};

// OVERRIDE: not exported, wrapped below.
const baseSlashMenu: SlashMenuConfig = {
  extendGroups: (groups) =>
    groups
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
          if (
            group.items.some((item) => item.value === IMAGE_SLASH_ITEM.value)
          ) {
            return group;
          }

          const paragraphIndex = group.items.findIndex(
            (item) => item.value === 'p',
          );

          return {
            ...group,
            items:
              paragraphIndex === -1
                ? [...group.items, IMAGE_SLASH_ITEM]
                : [
                    ...group.items.slice(0, paragraphIndex + 1),
                    IMAGE_SLASH_ITEM,
                    ...group.items.slice(paragraphIndex + 1),
                  ],
          };
        }

        return group;
      })
      .filter((group) => group && group.items.length > 0) as SlashMenuGroup[],
};

// OVERRIDE: the "Table" entry inserts a 3 × 3 table with a header row.
export const slashMenu: SlashMenuConfig = {
  ...baseSlashMenu,
  extendGroups: (groups) =>
    (baseSlashMenu.extendGroups?.(groups) ?? groups).map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.value === KEYS.table
          ? { ...item, onSelect: (editor) => insertWikiTable(editor) }
          : item,
      ),
    })),
};
