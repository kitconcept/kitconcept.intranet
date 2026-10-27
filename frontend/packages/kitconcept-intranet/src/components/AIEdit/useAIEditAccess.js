/**
 * May the current user use the AI assistant here, and with which context
 * budget (spec §4, D22)?
 *
 * Used by the panel when it is first opened (the Sidebar shows the tab from
 * the `@site` flag alone, so forms where the tab is not used make no request).
 * Asks `GET @ai-edit` (same permission as the POST) on the content of the
 * form: the content (edit form) or the folder (add form).
 */
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { aiEditAvailable } from '../../actions';
import { setTrace } from './debug';

// The user lacks the "Use AI editing" permission on the context
export const isForbidden = (error) =>
  [401, 403].includes(error?.status ?? error?.response?.statusCode);

/**
 * `{access, budget}` for `url` (`''` is the site root): `access` is
 * `'checking'`, `'ready'`, `'forbidden'` or `'not_configured'`; `budget`
 * holds `contextLength`, `reserveTokens`, `fixedPromptChars` and the
 * backend's `vocabulary` (operations, categories, structural tags; empty
 * until known, or when the backend has no context length configured: then
 * only the number of turns is limited).
 */
const useAIEditAccess = (url) => {
  const dispatch = useDispatch();
  const [state, setState] = useState({ access: 'checking', budget: {} });

  useEffect(() => {
    let current = true;
    setState({ access: 'checking', budget: {} });
    dispatch(aiEditAvailable(url))
      .then((result) => {
        if (!current) return;
        setTrace(result.trace);
        setState({
          access: result.available ? 'ready' : 'not_configured',
          budget: {
            contextLength: result.context_length || undefined,
            reserveTokens: result.reserve_tokens || 0,
            fixedPromptChars: result.fixed_prompt_chars || 0,
            vocabulary: {
              operations: result.operations,
              categories: result.categories,
              structuralTags: result.structural_tags,
            },
          },
        });
      })
      .catch((e) => {
        // Any other failure: the check is only a convenience, the POST is
        // the real gate and reports its own errors.
        if (current) {
          setState({
            access: isForbidden(e) ? 'forbidden' : 'ready',
            budget: {},
          });
        }
      });
    return () => {
      current = false;
    };
  }, [dispatch, url]);

  return state;
};

export default useAIEditAccess;
