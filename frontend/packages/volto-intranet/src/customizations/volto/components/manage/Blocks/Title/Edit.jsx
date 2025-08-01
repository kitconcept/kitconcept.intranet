/**
 * OVERRIDE Edit.jsx
 * REASON: Add a slot below the title block.
 * FILE: https://github.com/plone/volto/blob/0b06447408cad92728183ae597a76e7e9f8a5ddb/packages/volto/src/components/manage/Blocks/Title/Edit.jsx
 * FILE VERSION: Volto 18.23.0
 * PULL REQUEST: https://github.com/kitconcept/kitconcept.intranet/pull/131
 * TICKET: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/issues/19
 * DATE: 2025-07-29
 * DEVELOPER: @Tishasoumya-02
 * CHANGELOG:
 *  - Add documentByLine feature. @Tishasoumya-02
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Editor, Node, Transforms, Range, createEditor } from 'slate';
import { ReactEditor, Editable, Slate, withReact } from 'slate-react';
import { useSelector, shallowEqual } from 'react-redux';
import SlotRenderer from '@plone/volto/components/theme/SlotRenderer/SlotRenderer';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import config from '@plone/volto/registry';
import { P } from '@plone/volto-slate/constants';

const messages = defineMessages({
  title: {
    id: 'Type the title…',
    defaultMessage: 'Type the title…',
  },
});

function usePrevious(value) {
  const ref = useRef();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export const TitleBlockEdit = (props) => {
  const {
    block,
    blockNode,
    data,
    detached,
    editable,
    index,
    metadata,
    onAddBlock,
    onChangeField,
    onFocusNextBlock,
    onFocusPreviousBlock,
    onSelectBlock,
    properties,
    selected,
  } = props;

  const [editor] = useState(withReact(createEditor()));
  const [initialValue] = useState([
    {
      type: P,
      children: [{ text: metadata?.['title'] || properties?.['title'] || '' }],
    },
  ]);

  const intl = useIntl();

  const prevSelected = usePrevious(selected);

  const text = useMemo(
    () => metadata?.['title'] || properties?.['title'] || '',
    [metadata, properties],
  );

  const placeholder = useMemo(
    () => data.placeholder || intl.formatMessage(messages['title']),
    [data.placeholder, intl],
  );
  const disableNewBlocks = useMemo(() => detached, [detached]);
  const content = useSelector((state) => state.content.data, shallowEqual);

  useEffect(() => {
    if (!prevSelected && selected) {
      if (editor.selection && Range.isCollapsed(editor.selection)) {
        // keep selection
        ReactEditor.focus(editor);
      } else {
        // nothing is selected, move focus to end
        // make sure that the editor is focused
        setTimeout(() => {
          const focused = ReactEditor.focus(editor);
          if (!focused) {
            ReactEditor.focus(editor);
            Transforms.select(editor, Editor.end(editor, []));
          }
        }, 0);
      }
    }
  }, [prevSelected, selected, editor]);

  useEffect(() => {
    // undo/redo handlerr
    const oldText = Node.string(editor);
    if (oldText !== text) {
      Transforms.insertText(editor, text, {
        at: [0, 0],
      });
    }
  }, [editor, text]);

  const handleChange = useCallback(() => {
    const newText = Node.string(editor);
    if (newText !== text) {
      onChangeField('title', newText);
    }
  }, [editor, onChangeField, text]);

  const handleKeyDown = useCallback(
    (ev) => {
      if (ev.key === 'Return' || ev.key === 'Enter') {
        ev.preventDefault();
        if (!disableNewBlocks) {
          onSelectBlock(
            onAddBlock(config.settings.defaultBlockType, index + 1),
          );
        }
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        onFocusPreviousBlock(block, blockNode.current);
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        onFocusNextBlock(block, blockNode.current);
      }
    },
    [
      index,
      blockNode,
      disableNewBlocks,
      onSelectBlock,
      onAddBlock,
      onFocusPreviousBlock,
      onFocusNextBlock,
      block,
    ],
  );

  const handleFocus = useCallback(() => {
    onSelectBlock(block);
  }, [block, onSelectBlock]);

  const renderElement = useCallback(({ attributes, children }) => {
    return (
      <h1 {...attributes} className="documentFirstHeading">
        {children}
      </h1>
    );
  }, []);

  if (typeof window.__SERVER__ !== 'undefined') {
    return <div />;
  }
  return (
    <Slate editor={editor} onChange={handleChange} initialValue={initialValue}>
      <Editable
        readOnly={!editable}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        renderElement={renderElement}
        onFocus={handleFocus}
        aria-multiline="false"
      ></Editable>
      {/* START CUSTOMIZATION */}
      <SlotRenderer name="belowContentTitle" content={content} />
      {/* END CUSTOMIZATION */}
    </Slate>
  );
};

TitleBlockEdit.propTypes = {
  properties: PropTypes.objectOf(PropTypes.any).isRequired,
  selected: PropTypes.bool.isRequired,
  block: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onChangeField: PropTypes.func.isRequired,
  onSelectBlock: PropTypes.func.isRequired,
  onDeleteBlock: PropTypes.func.isRequired,
  onAddBlock: PropTypes.func.isRequired,
  onFocusPreviousBlock: PropTypes.func.isRequired,
  onFocusNextBlock: PropTypes.func.isRequired,
  data: PropTypes.objectOf(PropTypes.any).isRequired,
  editable: PropTypes.bool,
  detached: PropTypes.bool,
  blockNode: PropTypes.any,
};

TitleBlockEdit.defaultProps = {
  detached: false,
  editable: true,
};

export default TitleBlockEdit;
