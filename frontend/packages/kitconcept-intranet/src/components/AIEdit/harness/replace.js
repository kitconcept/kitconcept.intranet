/**
 * Finding the text of a `replace_text` operation in a field (spec §8,
 * D41, AI_WORKFLOW.md). The field is searched as the model saw it (the
 * projected Markdown, placeholders included).
 *
 * - Exact first. If it does not occur, once more loosely: Markdown
 *   escapes (`1\. Preis`), runs of whitespace and typographic quotes and
 *   dashes are ignored, the slips small models make when copying.
 * - Each match is a span `[start, end]` of the field's text.
 * - Nothing found: the closest passage, as a suggestion for the repair.
 */

const LOOSE = {
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
  ' ': ' ',
};

/**
 * The text normalized for the loose search, with the original position of
 * every character kept (`map[i]` is where normalized character i came
 * from).
 */
const normalize = (text) => {
  let out = '';
  const map = [];
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    // A Markdown escape: the backslash before punctuation is dropped
    if (char === '\\' && /[^\w\s]/.test(text[i + 1] || '')) continue;
    const plain = LOOSE[char] ?? char;
    if (/\s/.test(plain)) {
      if (out.endsWith(' ')) continue;
      out += ' ';
    } else {
      out += plain;
    }
    map.push(i);
  }
  return { out, map };
};

const occurrences = (text, find) => {
  const spans = [];
  let at = text.indexOf(find);
  while (at !== -1) {
    spans.push([at, at + find.length]);
    at = text.indexOf(find, at + 1);
  }
  return spans;
};

/**
 * Where `find` occurs in `text`: `{spans, loose}`, all matches, exact
 * ones if there are any, else the loose ones (mapped back to the
 * original text).
 */
export const locate = (text, find) => {
  if (!find) return { spans: [], loose: false };
  const exact = occurrences(text, find);
  if (exact.length) return { spans: exact, loose: false };
  const haystack = normalize(text);
  const needle = normalize(find).out.trim();
  if (!needle) return { spans: [], loose: true };
  return {
    spans: occurrences(haystack.out, needle).map(([start, end]) => [
      haystack.map[start],
      haystack.map[end - 1] + 1,
    ]),
    loose: true,
  };
};

/**
 * The edit distance of `a` and `b`, or `max + 1` as soon as it is
 * certainly above `max` (every value of a row is): a long field has
 * thousands of passages to compare, most of them far off (a code review:
 * seconds on the main thread for one not-found `find`).
 */
const distance = (a, b, max = Infinity) => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let lowest = i;
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      if (current[j] < lowest) lowest = current[j];
    }
    if (lowest > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
};

// How alike a passage must be to be named (half its characters)
const ALIKE = 0.5;

/**
 * The passage of `text` most like `find` (as many words, one more or
 * less), or null when nothing is at least half alike. For the repair
 * message: "not found; closest: ...".
 */
export const closest = (text, find) => {
  const words = [...text.matchAll(/\S+/g)];
  const count = (find.match(/\S+/g) || []).length;
  if (!words.length || !count) return null;
  const target = find.toLowerCase();
  let best = null;
  for (let size = Math.max(1, count - 1); size <= count + 1; size += 1) {
    for (let i = 0; i + size <= words.length; i += 1) {
      const last = words[i + size - 1];
      const passage = text.slice(words[i].index, last.index + last[0].length);
      const longest = Math.max(passage.length, target.length);
      // Only what could still beat the best so far, or be alike at all
      const max = Math.floor(longest * (1 - Math.max(ALIKE, best?.score ?? 0)));
      const score = 1 - distance(passage.toLowerCase(), target, max) / longest;
      if (!best || score > best.score) best = { passage, score };
    }
  }
  return best && best.score >= ALIKE ? best.passage : null;
};

/** `text` with every span replaced, back to front (spans do not overlap). */
export const applySpans = (text, spans) =>
  [...spans]
    .sort((a, b) => b.start - a.start)
    .reduce(
      (result, span) =>
        result.slice(0, span.start) + span.replace + result.slice(span.end),
      text,
    );

export const overlaps = (span, spans) =>
  spans.some((other) => span.start < other.end && other.start < span.end);

// A repeat shorter than this, or without a letter or digit, is no
// mistake (a space, a comma)
const MIN_REPEAT = 3;

/**
 * The text a replacement would repeat at its edge: the end of `replace`
 * equal to what follows the match, or its start equal to what precedes
 * it ("Thursday, March 18" -> "Friday, April 9, 2027" before ", 2027"
 * gives "2027, 2027"). Returns the repeated text, or null.
 */
export const repeatedEdge = (text, start, end, replace) => {
  const repeated = (piece) =>
    piece.length >= MIN_REPEAT && /[\p{L}\p{N}]/u.test(piece);
  const after = text.slice(end);
  for (
    let n = Math.min(replace.length, after.length);
    n >= MIN_REPEAT;
    n -= 1
  ) {
    const piece = after.slice(0, n);
    if (replace.endsWith(piece) && repeated(piece)) return piece;
  }
  const before = text.slice(0, start);
  for (
    let n = Math.min(replace.length, before.length);
    n >= MIN_REPEAT;
    n -= 1
  ) {
    const piece = before.slice(before.length - n);
    if (replace.startsWith(piece) && repeated(piece)) return piece;
  }
  return null;
};
