import { useEffect, useRef } from 'react';

interface KeyHandlers {
  onEnter: () => void;
  onEscape: () => void;
}

/**
 * `TreeItem`'s row (react-aria's `useGridListItem`/`useSelectableCollection`)
 * owns a capture-phase keydown handler that hijacks both arrow-key row
 * navigation AND single-character typeahead (typing e.g. "L" jumps focus to
 * the next item starting with "L") — even when a nested input has focus.
 * That handler runs before any handler attached to the input itself (it's
 * an ancestor, and capture propagation is outside-in), so the only way to
 * stop it is a native listener above the React root.
 *
 * Stopping the native event there also means React's own `onKeyDown` on the
 * input never fires, so Enter/Escape have to be handled here too, via
 * `onEnter`/`onEscape`, instead of as normal React event handlers.
 *
 * `onEnter`/`onEscape` are read through a ref so this hook's own listener
 * only needs to be attached once per `active` toggle, not re-attached on
 * every keystroke just because the caller's closures changed identity.
 */
export function useSuppressRowKeyHandling(
  active: boolean,
  inputRef: React.RefObject<HTMLInputElement>,
  handlers: KeyHandlers,
) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!active) return;
    function onKeyDownCapture(event: KeyboardEvent) {
      if (event.target !== inputRef.current) return;
      event.stopPropagation();
      if (event.key === 'Enter') {
        event.preventDefault();
        handlersRef.current.onEnter();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        handlersRef.current.onEscape();
      }
    }
    document.addEventListener('keydown', onKeyDownCapture, true);
    return () =>
      document.removeEventListener('keydown', onKeyDownCapture, true);
  }, [active, inputRef]);
}
