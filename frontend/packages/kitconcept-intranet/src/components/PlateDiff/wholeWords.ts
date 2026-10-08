/**
 * Extends the text marks of a Plate diff to whole words.
 *
 * `computeDiff` (`@platejs/diff`) compares text character by character:
 * "liegt" → "steht" comes back as "~lieg~" + "+steh+" + "t". That is
 * correct, but hard to read. `expandDiffToWords` rewrites the text leaves so
 * that a word that changed anywhere is marked as a whole: "~liegt~" +
 * "+steht+".
 *
 * Only inserted and deleted text is touched. Leaf formatting (bold, colour,
 * …) is kept, inline elements (links, mentions, dates) are word boundaries
 * and are processed on their own, and leaves whose formatting changed
 * (`update`) as well as added or removed elements are passed through as they
 * are.
 *
 * Ticket: https://gitlab.kitconcept.io/kitconcept/distribution-kitconcept-intranet/-/work_items/714
 */
import type { Descendant, TElement, TText } from 'platejs';

type DiffType = 'insert' | 'delete' | 'update';

type DiffLeaf = TText & {
  diff?: boolean;
  diffOperation?: { type: DiffType };
};

type DiffElement = TElement & { diffOperation?: { type: DiffType } };

/**
 * - `equal`: unchanged text, part of both versions
 * - `insert` / `delete`: text of only one version
 * - `fixed`: text of both versions that must stay as it is (a leaf whose
 *   formatting changed)
 */
type Op = 'equal' | 'insert' | 'delete' | 'fixed';

/** One UTF-16 code unit of a run of text leaves. */
type Cell = {
  char: string;
  op: Op;
  /** Index of the leaf the character comes from. */
  leaf: number;
  /** Set when an `equal` character belongs to a changed word. */
  changed: boolean;
};

/**
 * A word: letters, digits and combining marks, optionally joined by a single
 * punctuation character inside the word ("GreenCat-Portal", "25.09",
 * "10:30", "3,5", "m.engelhardt@example.org"). Punctuation at the edge of a
 * word is not part of it.
 */
const WORD = /[\p{L}\p{N}\p{M}]+(?:[-_'’.,:/@][\p{L}\p{N}\p{M}]+)*/gu;

const isText = (node: Descendant): node is DiffLeaf => 'text' in node;

const leafOp = (leaf: DiffLeaf): Op => {
  const type = leaf.diff ? leaf.diffOperation?.type : undefined;
  if (type === 'insert' || type === 'delete') return type;
  return type ? 'fixed' : 'equal';
};

/** The leaf without its text and diff annotation: its formatting. */
const leafFormat = (leaf: DiffLeaf): Record<string, unknown> => {
  const { text: _text, diff: _diff, diffOperation: _op, ...format } = leaf;
  return format;
};

const formatKey = (format: Record<string, unknown>): string =>
  JSON.stringify(
    Object.keys(format)
      .sort()
      .map((key) => [key, format[key]]),
  );

/** The words of one version, each as the indices of its cells. */
const wordsOf = (cells: Cell[], version: 'old' | 'new'): number[][] => {
  const skipped: Op = version === 'old' ? 'insert' : 'delete';
  const indices: number[] = [];
  let text = '';
  cells.forEach((cell, index) => {
    if (cell.op === skipped) return;
    indices.push(index);
    text += cell.char;
  });
  return Array.from(text.matchAll(WORD), (match) =>
    indices.slice(match.index, match.index + match[0].length),
  );
};

const isChanged = (cell: Cell): boolean =>
  cell.changed || cell.op === 'insert' || cell.op === 'delete';

/**
 * Marks every unchanged character of a word that was touched by a change.
 * A word is touched when a changed character lies between its first and its
 * last character; this includes text inserted into the middle of an old word
 * and text removed from the middle of a new word. Marking a word of one
 * version can touch a word of the other, so marks are followed from word to
 * word with a worklist. Every word is handled at most once and every cell
 * marked at most once: linear in the length of the run.
 */
const markChangedWords = (cells: Cell[]): void => {
  const oldWords = wordsOf(cells, 'old');
  const newWords = wordsOf(cells, 'new');
  const words = [...oldWords, ...newWords];
  const isOld = (word: number) => word < oldWords.length;

  // The word of each version a cell belongs to (-1: none).
  const oldWordOf = new Int32Array(cells.length).fill(-1);
  const newWordOf = new Int32Array(cells.length).fill(-1);
  words.forEach((word, index) => {
    const map = isOld(index) ? oldWordOf : newWordOf;
    for (const cell of word) map[cell] = index;
  });

  const dirty = new Uint8Array(words.length);
  const queue: number[] = [];
  const enqueue = (word: number) => {
    if (word >= 0 && !dirty[word]) {
      dirty[word] = 1;
      queue.push(word);
    }
  };

  // Words whose span holds an inserted or deleted character. The spans of
  // one version are disjoint and ordered, so one pointer per version does.
  let old = 0;
  let next = 0;
  cells.forEach((cell, index) => {
    if (cell.op !== 'insert' && cell.op !== 'delete') return;
    while (old < oldWords.length && oldWords[old].at(-1)! < index) old += 1;
    if (old < oldWords.length && oldWords[old][0] <= index) enqueue(old);
    while (next < newWords.length && newWords[next].at(-1)! < index) next += 1;
    if (next < newWords.length && newWords[next][0] <= index) {
      enqueue(oldWords.length + next);
    }
  });

  // A marked character belongs to a word of the other version as well.
  while (queue.length > 0) {
    const word = queue.pop()!;
    const other = isOld(word) ? newWordOf : oldWordOf;
    for (const index of words[word]) {
      const cell = cells[index];
      if (cell.op === 'equal' && !cell.changed) {
        cell.changed = true;
        enqueue(other[index]);
      }
    }
  }
};

const expandRun = (leaves: DiffLeaf[]): DiffLeaf[] => {
  const ops = leaves.map(leafOp);
  if (!ops.some((op) => op === 'insert' || op === 'delete')) return leaves;

  const cells: Cell[] = leaves.flatMap((leaf, index) =>
    leaf.text
      .split('')
      .map((char) => ({ char, op: ops[index], leaf: index, changed: false })),
  );
  markChangedWords(cells);

  const formats = leaves.map(leafFormat);
  const keys = formats.map(formatKey);
  const result: DiffLeaf[] = [];
  let lastKey: string | undefined;

  /** Appends text, joining it with the previous leaf if nothing differs. */
  const push = (
    text: string,
    leaf: number,
    type: 'insert' | 'delete' | undefined,
  ) => {
    const key = `${type}|${keys[leaf]}`;
    const last = result[result.length - 1];
    if (last && key === lastKey) {
      last.text += text;
      return;
    }
    lastKey = key;
    result.push(
      type
        ? { ...formats[leaf], text, diff: true, diffOperation: { type } }
        : { ...formats[leaf], text },
    );
  };

  let deleted: Cell[] = [];
  let inserted: Cell[] = [];
  // A changed stretch shows the old text first, then the new text.
  const flush = () => {
    deleted.forEach((cell) => push(cell.char, cell.leaf, 'delete'));
    inserted.forEach((cell) => push(cell.char, cell.leaf, 'insert'));
    deleted = [];
    inserted = [];
  };

  let fixedLeaf = -1;
  for (const cell of cells) {
    if (isChanged(cell)) {
      if (cell.op !== 'insert') deleted.push(cell);
      if (cell.op !== 'delete') inserted.push(cell);
    } else if (cell.op === 'fixed') {
      flush();
      // A leaf whose formatting changed keeps its own annotation.
      if (cell.leaf !== fixedLeaf) {
        fixedLeaf = cell.leaf;
        lastKey = undefined;
        result.push({ ...leaves[cell.leaf] });
      }
    } else {
      flush();
      push(cell.char, cell.leaf, undefined);
    }
  }
  flush();
  return result;
};

/**
 * Returns the diff with every text mark extended to the whole word.
 * `nodes` is the result of `computeDiff` (or the children of one of its
 * elements).
 */
export const expandDiffToWords = (nodes: Descendant[]): Descendant[] => {
  const result: Descendant[] = [];
  let run: DiffLeaf[] = [];
  const flush = () => {
    if (run.length > 0) result.push(...expandRun(run));
    run = [];
  };
  for (const node of nodes) {
    if (isText(node)) {
      run.push(node);
      continue;
    }
    flush();
    const element = node as DiffElement;
    const type = element.diffOperation?.type;
    // An added or removed element is marked as a whole.
    result.push(
      type === 'insert' || type === 'delete'
        ? element
        : { ...element, children: expandDiffToWords(element.children) },
    );
  }
  flush();
  return result;
};
