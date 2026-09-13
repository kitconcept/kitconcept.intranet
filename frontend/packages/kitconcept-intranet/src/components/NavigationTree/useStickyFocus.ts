import { useLayoutEffect } from 'react';

/**
 * Force focus onto `inputRef` while `active`.
 *
 * Whatever opened this input (e.g. a Menu/Popover closing) may also try to
 * restore focus to its own trigger as part of the same update. In practice
 * this component's synchronous `focus()` call below wins that: React tears
 * down the closing overlay's effects (where that restoration runs) before
 * running effects for newly-mounted components, so our call ends up as the
 * last word in the same commit.
 */
export function useStickyFocus(
  active: boolean,
  inputRef: React.RefObject<HTMLInputElement>,
) {
  useLayoutEffect(() => {
    if (!active) return;
    const input = inputRef.current;
    if (!input) return;

    input.focus();
    input.select();
  }, [active, inputRef]);
}
