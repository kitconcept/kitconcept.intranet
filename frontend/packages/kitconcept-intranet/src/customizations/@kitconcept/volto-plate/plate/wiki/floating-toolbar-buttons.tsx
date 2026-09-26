/**
 * OVERRIDE floating-toolbar-buttons.tsx
 * REASON: Add an "Insert table" button (3 × 3 with header row) next to the
 *         list and toggle buttons, so a table can be inserted from the
 *         toolbar as well as with the `/table` slash command. The relative
 *         import of the clear-formatting button is made absolute (shadowed
 *         files resolve relative imports against this package).
 * FILE: https://github.com/kitconcept/volto-plate/blob/1.0.0-alpha.28/packages/volto-plate/src/plate/wiki/floating-toolbar-buttons.tsx
 * FILE VERSION: @kitconcept/volto-plate 1.0.0-alpha.28
 * DATE: 2026-09-22
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/655
 * DEVELOPER: @reekitconcept
 */

import {
  BoldIcon,
  Code2Icon,
  ItalicIcon,
  StrikethroughIcon,
  TableIcon,
  // UnderlineIcon,
  // WandSparklesIcon,
} from 'lucide-react';
import { KEYS } from 'platejs';
import { useEditorReadOnly, useEditorRef } from 'platejs/react';
import { defineMessages, useIntl } from 'react-intl';

// import { AIToolbarButton } from '@plone/plate/components/ui/ai-toolbar-button';
import { CommentToolbarButton } from '@plone/plate/components/ui/comment-toolbar-button';
import { LinkToolbarButton } from '@plone/plate/components/ui/link-toolbar-button';
import { MarkToolbarButton } from '@plone/plate/components/ui/mark-toolbar-button';
import { MoreToolbarButton } from '@plone/plate/components/ui/more-toolbar-button';
import { BlockWidthToolbarButton } from '@plone/plate/components/ui/block-width-toolbar-button';
import { SuggestionToolbarButton } from '@plone/plate/components/ui/suggestion-toolbar-button';
import {
  ToolbarButton,
  ToolbarGroup,
} from '@plone/plate/components/ui/toolbar';
import { TurnIntoToolbarButton } from '@plone/plate/components/ui/turn-into-toolbar-button';
import {
  BulletedListToolbarButton,
  NumberedListToolbarButton,
  TodoListToolbarButton,
} from '@plone/plate/components/ui/list-toolbar-button';
import { ToggleToolbarButton } from '@plone/plate/components/ui/toggle-toolbar-button';
import { ClearFormattingToolbarButton } from '@kitconcept/volto-plate/plate/wiki/clear-formatting-toolbar-button';
import { insertWikiTable } from '@kitconcept/intranet/components/WikiTable/insertWikiTable';

// OVERRIDE: messages are duplicated in src/index.ts so the i18n extraction
// picks them up (shadowed files are not scanned).
const messages = defineMessages({
  insertTable: {
    id: 'Insert table',
    defaultMessage: 'Insert table',
  },
});

// OVERRIDE: insert a 3 × 3 table with a header row at the selection.
function InsertTableToolbarButton() {
  const editor = useEditorRef();
  const intl = useIntl();

  return (
    <ToolbarButton
      tooltip={intl.formatMessage(messages.insertTable)}
      onClick={() => {
        insertWikiTable(editor);
        editor.tf.focus();
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <TableIcon />
    </ToolbarButton>
  );
}

export function FloatingToolbarButtons() {
  const readOnly = useEditorReadOnly();

  return (
    <>
      {!readOnly && (
        <>
          {/* <ToolbarGroup>
            <AIToolbarButton tooltip="AI commands">
              <WandSparklesIcon />
              Ask AI
            </AIToolbarButton>
          </ToolbarGroup> */}

          <ToolbarGroup>
            <MarkToolbarButton nodeType={KEYS.bold} tooltip="Bold (⌘+B)">
              <BoldIcon />
            </MarkToolbarButton>

            <MarkToolbarButton nodeType={KEYS.italic} tooltip="Italic (⌘+I)">
              <ItalicIcon />
            </MarkToolbarButton>

            {/* <MarkToolbarButton
              nodeType={KEYS.underline}
              tooltip="Underline (⌘+U)"
            >
              <UnderlineIcon />
            </MarkToolbarButton> */}

            <MarkToolbarButton
              nodeType={KEYS.strikethrough}
              tooltip="Strikethrough (⌘+⇧+M)"
            >
              <StrikethroughIcon />
            </MarkToolbarButton>

            <LinkToolbarButton />

            <MarkToolbarButton nodeType={KEYS.code} tooltip="Code (⌘+E)">
              <Code2Icon />
            </MarkToolbarButton>

            <ClearFormattingToolbarButton />

            <TurnIntoToolbarButton />
          </ToolbarGroup>

          <ToolbarGroup>
            <NumberedListToolbarButton />
            <BulletedListToolbarButton />
            <TodoListToolbarButton />
            <BlockWidthToolbarButton />
            <ToggleToolbarButton />
            {/* OVERRIDE */}
            <InsertTableToolbarButton />
          </ToolbarGroup>
        </>
      )}

      <ToolbarGroup>
        <CommentToolbarButton />
        <SuggestionToolbarButton />

        {!readOnly && <MoreToolbarButton />}
      </ToolbarGroup>
    </>
  );
}
