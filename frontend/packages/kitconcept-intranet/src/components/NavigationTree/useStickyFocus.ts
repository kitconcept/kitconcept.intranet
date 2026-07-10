import { useLayoutEffect } from 'react';

/**
 * Force focus onto `inputRef` while `active`.
 *
 * Whatever opened this input (e.g. a Menu/Popover closing) may also try to
 * restore focus to its own trigger as part of the same update. In practice
 * this component's synchronous `focus()` call below wins that: React tears
 * down the closing overlay's effects (where that restoration runs) before
 * running effects for newly-mounted components, so our call ends up as the
 * last word in the same commit — the `document.activeElement === input`
 * check right after it holds. The `focusin` listener below exists as a
 * fallback for the rare case where that isn't true and something manages
 * to steal focus afterward.
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
    if (document.activeElement === input) return; // won already, nothing to fight

    // Something (the closing Menu/Popover) is about to steal focus back
    // asynchronously. Instead of guessing how long that takes, just react
    // to it: whenever focus lands somewhere else, take it back — until it
    // actually lands on our input, then stop watching.
    // function onFocusIn() {
    //   if (document.activeElement === input) {
    //     document.removeEventListener('focusin', onFocusIn);
    //     return;
    //   }
    //   input!.focus();
    //   input!.select();
    // }
    // document.addEventListener('focusin', onFocusIn);
    // return () => document.removeEventListener('focusin', onFocusIn);
  }, [active, inputRef]);
}
