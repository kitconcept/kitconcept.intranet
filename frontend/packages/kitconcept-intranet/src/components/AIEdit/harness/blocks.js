/**
 * Immutable operations on Volto form data with nested blocks. A container
 * is any block (or the form data itself) with `blocks` and
 * `blocks_layout.items`; a `path` is the list of container block ids from
 * the top, `[]` for the page itself. Only the containers along a path are
 * copied: everything else keeps its identity (minimal diff, spec §8).
 */

const itemsOf = (container) => container?.blocks_layout?.items || [];

/**
 * Where block `id` is: `{block, path, index, container}`, or null.
 * Searches nested containers too.
 */
export const locate = (data, id, path = []) => {
  const items = itemsOf(data);
  for (let index = 0; index < items.length; index += 1) {
    const childId = items[index];
    const child = data.blocks?.[childId];
    if (child) {
      if (childId === id) return { block: child, path, index, container: data };
      if (child.blocks && child.blocks_layout) {
        const found = locate(child, id, [...path, childId]);
        if (found) return found;
      }
    }
  }
  return null;
};

/** The container at `path`. */
export const containerAt = (data, path) =>
  path.reduce((container, id) => container?.blocks?.[id], data);

/** `data` with the container at `path` replaced by `update(container)`. */
export const updateContainer = (data, path, update) => {
  if (!path.length) return update(data);
  const [id, ...rest] = path;
  return {
    ...data,
    blocks: {
      ...data.blocks,
      [id]: updateContainer(data.blocks[id], rest, update),
    },
  };
};

export const replaceBlock = (data, path, id, block) =>
  updateContainer(data, path, (container) => ({
    ...container,
    blocks: { ...container.blocks, [id]: block },
  }));

/** Insert `entries` (`[[id, block], ...]`) at `index` of a container. */
export const insertBlocks = (data, path, index, entries) =>
  updateContainer(data, path, (container) => {
    const items = [...itemsOf(container)];
    items.splice(index, 0, ...entries.map(([id]) => id));
    return {
      ...container,
      blocks: { ...container.blocks, ...Object.fromEntries(entries) },
      blocks_layout: { ...container.blocks_layout, items },
    };
  });

export const removeBlock = (data, path, id) =>
  updateContainer(data, path, (container) => {
    const { [id]: removed, ...blocks } = container.blocks;
    return {
      ...container,
      blocks,
      blocks_layout: {
        ...container.blocks_layout,
        items: itemsOf(container).filter((item) => item !== id),
      },
    };
  });
