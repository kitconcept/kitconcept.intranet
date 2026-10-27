/**
 * What the AI panel reads from the conversation and the Volto form state
 * (kept out of the component so it can be tested).
 */

/**
 * The blocks applied changes created in the whole conversation: new
 * inserts place themselves after them (harness/changes.js). Change keys
 * are unique within one answer only (`insert:1` in each), so they are
 * prefixed with the answer's position.
 */
export const createdBlocks = (conversation) =>
  conversation.reduce(
    (all, message, index) => ({
      ...all,
      ...Object.fromEntries(
        Object.entries(message.created || {}).map(([key, value]) => [
          `${index}:${key}`,
          value,
        ]),
      ),
    }),
    {},
  );

/**
 * The block the form selects by itself when it opens, as Volto's Form
 * does: none when `focus` (`config.blocks.initialBlocksFocus`) is null,
 * the block of the type it names for the content type, else the first.
 */
export const initialSelection = (formData, type, focus) => {
  const items = formData?.blocks_layout?.items || [];
  if (!items.length || focus === null) return null;
  if (focus && type in focus) {
    return (
      Object.keys(formData.blocks || {})
        .filter((id) => formData.blocks[id]?.['@type'] === focus[type])
        .pop() ?? null
    );
  }
  return items[0];
};

/** The form's content type: the edited content's, or `?type=` when adding. */
export const formType = (state) => {
  const location = state.router?.location;
  return /\/add$/.test(location?.pathname || '')
    ? new URLSearchParams(location?.search || '').get('type')
    : state.content?.data?.['@type'];
};

/**
 * The blocks the editor selected: in a grid the clicked column
 * (`gridSelected`, only while `selected` is its grid), and the
 * multi-selection. The form's own initial selection is not "this block"
 * until the editor changes the selection (`changed`).
 */
export const selectedBlocks = (state, changed, focus) => {
  const { global: formData, ui = {} } = state.form;
  const column =
    ui.gridSelected &&
    formData?.blocks?.[ui.selected]?.blocks?.[ui.gridSelected] &&
    ui.gridSelected;
  const selected = column || ui.selected;
  const initial =
    !changed &&
    !column &&
    selected === initialSelection(formData, formType(state), focus);
  return [initial ? null : selected, ...(ui.multiSelected || [])].filter(
    Boolean,
  );
};
