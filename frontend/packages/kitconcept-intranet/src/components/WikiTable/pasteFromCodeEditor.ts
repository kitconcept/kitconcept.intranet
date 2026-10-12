/**
 * Pastes from a code editor are treated as plain text.
 *
 * VS Code and Cursor put the copied text on the clipboard as HTML too:
 * coloured `<span>`s inside `<div>`s, nothing else. Plate's plain-text
 * parsers (markdown, and the CSV paste of this package) decline every
 * paste that carries HTML, so CSV or markdown copied from a code editor
 * arrived as paragraphs unless pasted with Shift+Cmd+V. HTML that holds
 * nothing but such structure is ignored and the text is taken instead.
 * HTML with formatting (bold, links, lists, tables, …) is still left to the
 * HTML parsers.
 *
 * Tickets: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/751
 * (the markdown part is outside that ticket's scope, same cause and fix).
 */
import { isUrl, type Descendant, type SlatePlugin } from 'platejs';

/** The part of the markdown plugin's API the paste parser uses. */
type MarkdownApi = {
  markdown: { deserialize: (data: string) => Descendant[] };
};

/** Tags a code editor's clipboard HTML consists of. */
const PLAIN_TAGS = new Set([
  'meta',
  'div',
  'span',
  'br',
  'html',
  'head',
  'body',
]);

/**
 * Whether the HTML carries no formatting: only the structural tags a code
 * editor emits. Empty HTML counts as plain.
 */
export function htmlIsPlainText(html: string): boolean {
  if (!html) return true;
  for (const match of html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)/g)) {
    if (!PLAIN_TAGS.has(match[1].toLowerCase())) return false;
  }
  return true;
}

/**
 * The markdown plugin with a paste query that also accepts a code editor's
 * HTML (Plate's own query declines any HTML). The whole parser is given:
 * `extend` replaces the parser object, it does not merge into it.
 */
export function withCodeEditorPaste<T extends SlatePlugin>(plugins: T[]): T[] {
  return plugins.map((plugin) =>
    plugin.key === 'markdown'
      ? (plugin.extend(({ api }) => ({
          parser: {
            format: 'text/plain',
            deserialize: ({ data }: { data: string }) =>
              (api as unknown as MarkdownApi).markdown.deserialize(data),
            query: ({
              data,
              dataTransfer,
            }: {
              data: string;
              dataTransfer: DataTransfer;
            }) => {
              if (!htmlIsPlainText(dataTransfer.getData('text/html'))) {
                return false;
              }
              const { files } = dataTransfer;
              if (!files?.length && isUrl(data)) return false;
              return true;
            },
          },
        })) as T)
      : plugin,
  );
}
