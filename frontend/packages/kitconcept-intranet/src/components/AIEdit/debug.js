/**
 * Diagnostic logging of the AI assistant, off by default: requests and
 * answers contain the unsaved page and the conversation. On when the
 * backend runs with `KITCONCEPT_INTRANET_AI_EDIT_TRACE=1` (told by
 * `GET @ai-edit`), or in this browser with
 * `localStorage.setItem('aiEditDebug', '1')` (e.g. to save the site
 * profile for the eval, AI_EDIT_PLAN.md step 7). Logs at the default
 * console level: `console.debug` is hidden unless "Verbose" is on.
 */
let traced = false;

/** The backend's trace switch, from `GET @ai-edit`. */
export const setTrace = (on) => {
  if (on && !traced) {
    // eslint-disable-next-line no-console
    console.info(
      'AI assistant: tracing on (KITCONCEPT_INTRANET_AI_EDIT_TRACE on the backend)',
    );
  }
  traced = !!on;
};

const enabled = () => {
  if (traced) return true;
  try {
    return (
      typeof window !== 'undefined' &&
      window.localStorage?.getItem('aiEditDebug') === '1'
    );
  } catch {
    return false;
  }
};

export const debug = (...args) => {
  // eslint-disable-next-line no-console
  if (enabled()) console.log('AI assistant:', ...args);
};
