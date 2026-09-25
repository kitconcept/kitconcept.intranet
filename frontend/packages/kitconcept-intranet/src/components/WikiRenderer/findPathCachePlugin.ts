/**
 * Linear-time `findPath` for the read-only Plate renderers (view, diff).
 *
 * Plate's static rendering asks the editor for every node's path (node
 * prop injection, static element props). Without a DOM the editor falls
 * back to scanning the whole document from the root for each lookup, which
 * makes rendering quadratic: a wiki page with a 400-cell table took 10 s,
 * a 400-paragraph page 3 s of server rendering.
 *
 * This plugin walks the document once, caches node → path in a WeakMap and
 * rebuilds the cache when the editor's value changes. Cloned text leaves
 * (the static leaf renderer passes decorated copies) get no path without a
 * scan, which is what the scan would return anyway. Only for the renderer
 * presets: in the editor the DOM-based lookup is fast and the value changes
 * on every keystroke.
 */
import type { Path, TNode } from 'platejs';
import { createSlatePlugin, TextApi } from 'platejs';

export const FindPathCachePlugin = createSlatePlugin({
  key: 'wikiFindPathCache',
}).overrideEditor(({ editor, api: { findPath } }) => {
  let cachedFor: unknown = null;
  let cache = new WeakMap<object, Path>();

  const build = () => {
    cache = new WeakMap();
    cachedFor = editor.children;
    const walk = (node: TNode, path: Path) => {
      cache.set(node, path);
      const children = (node as { children?: TNode[] }).children;
      if (children) {
        children.forEach((child, index) => walk(child, [...path, index]));
      }
    };
    editor.children.forEach((node, index) => walk(node, [index]));
  };

  return {
    api: {
      findPath(node, options) {
        if (options) return findPath(node, options);
        if (cachedFor !== editor.children) build();
        const path = cache.get(node);
        if (path) return path;
        // The static leaf renderer looks up cloned leaf objects (decorated
        // leaves), which are never in the document: Plate's fallback would
        // scan the whole document for each of them and find nothing.
        if (TextApi.isText(node)) return undefined;
        return findPath(node, options);
      },
    },
  };
});
