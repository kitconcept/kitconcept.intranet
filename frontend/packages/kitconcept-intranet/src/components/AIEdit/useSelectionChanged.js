import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

/**
 * Whether the editor has changed the block selection since the form
 * opened (a ref, read when a request is sent): until then, the block the
 * form selects by itself is not "this block" (panelState.js). Used by the
 * Sidebar, which mounts with the form: tracked from the panel's first
 * opening, a block selected away from and back to before that counted as
 * the form's own (a code review).
 */
const useSelectionChanged = () => {
  const selected = useSelector((state) => state.form?.ui?.selected);
  const first = useRef(null);
  const changed = useRef(false);
  useEffect(() => {
    // The first selection seen is the form's own (it may set it after
    // this component mounts); none at all is no selection to mistake
    if (!selected) return;
    if (first.current === null) first.current = selected;
    else if (selected !== first.current) changed.current = true;
  }, [selected]);
  return changed;
};

export default useSelectionChanged;
