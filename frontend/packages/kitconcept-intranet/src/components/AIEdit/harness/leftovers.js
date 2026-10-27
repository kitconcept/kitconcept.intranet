/**
 * What an answer's replacements left on the page (spec §8, D42,
 * AI_WORKFLOW.md). Small models do not read every block: asked to change
 * a date everywhere, they found 3–4 of 6 mentions in three browser tests,
 * and asked about the rest in a follow-up call they kept the old date
 * (the page still showed it everywhere). So the harness finds the rest
 * and computes the replacements itself; the editor confirms them in the
 * review like any change.
 *
 * - What changed: `find` and `replace` without the words they share at
 *   either end ("on March 18, 2027" -> "on April 9, 2027": "March 18" ->
 *   "April 9").
 * - A changed date is looked for in the usual ways of writing it (March
 *   18, Mar 18th, 18 March, 18. März, 18.03., 3/18, the 18th) and
 *   replaced in the same way, a weekday in front of it included; a match
 *   followed by another year is another date and left alone; anything
 *   else is looked for as a whole word, in the same case. Weak matches
 *   ("3/18" without a year, "the 18th" before a word) and, for a change
 *   without a year, dates written with one are only listed (D57).
 *   Changes with a year are searched first.
 * - Searched in every changeable text of the page as it is, outside the
 *   spans the answer replaced; fields the answer rewrote are searched in
 *   their new text.
 * - A suggestion is a `replace_text` operation of the harness (validated
 *   like the model's), selected like the model's changes. What cannot be
 *   computed (another year, a rewritten field, another case) is listed.
 * - Dates that depend on a change (a deadline "one week before") are
 *   computed only where the page states the relation and it holds for
 *   the old values (`scanDependents`, D59); the looser check of D57
 *   flagged unrelated dates and was removed.
 */
import escapeRegExp from 'lodash/escapeRegExp';

const MONTHS = [
  { en: 'january', abbr: 'jan', de: 'januar', also: ['jänner'] },
  { en: 'february', abbr: 'feb', de: 'februar' },
  { en: 'march', abbr: 'mar', de: 'märz', also: ['maerz'] },
  { en: 'april', abbr: 'apr', de: 'april' },
  { en: 'may', abbr: 'may', de: 'mai' },
  { en: 'june', abbr: 'jun', de: 'juni' },
  { en: 'july', abbr: 'jul', de: 'juli' },
  { en: 'august', abbr: 'aug', de: 'august' },
  { en: 'september', abbr: 'sep', de: 'september', also: ['sept'] },
  { en: 'october', abbr: 'oct', de: 'oktober', also: ['okt'] },
  { en: 'november', abbr: 'nov', de: 'november' },
  { en: 'december', abbr: 'dec', de: 'dezember', also: ['dez'] },
];

const namesOf = (month) => [
  ...new Set([month.en, month.abbr, month.de, ...(month.also || [])]),
];

const monthOf = (word) =>
  MONTHS.findIndex((month) => namesOf(month).includes(word.toLowerCase())) + 1;

/** The spelling a month name was written in: en, abbr or de. */
const styleOf = (word) => {
  const month = MONTHS[monthOf(word) - 1];
  const lower = word.toLowerCase();
  if (lower === month.en) return 'en';
  if (lower === month.de) return 'de';
  return 'abbr';
};

const WEEKDAYS = {
  en: [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ],
  de: [
    'sonntag',
    'montag',
    'dienstag',
    'mittwoch',
    'donnerstag',
    'freitag',
    'samstag',
  ],
};

const ANY_MONTH = MONTHS.flatMap(namesOf).map(escapeRegExp).join('|');
const ORDINAL = '(?:st|nd|rd|th)';
const YEAR = /\b(?:19|20)\d{2}\b/;
// A year right after a date match: ", 2026", " 2026" or (18.03.)"2026"
const YEAR_AFTER = /^,?\s*((?:19|20)\d{2})\b/;

const capitalized = (word, like) =>
  like[0] === like[0].toUpperCase()
    ? word[0].toUpperCase() + word.slice(1)
    : word;

/** Month, day and (if written) year of the first date in `text`. */
export const dateIn = (text) => {
  const year = Number(YEAR.exec(text)?.[0]) || null;
  const named = new RegExp(
    `\\b(${ANY_MONTH})\\.?\\s+(\\d{1,2})${ORDINAL}?\\b`,
    'i',
  ).exec(text);
  if (named) return { month: monthOf(named[1]), day: Number(named[2]), year };
  const dayFirst = new RegExp(
    `\\b(\\d{1,2})(?:${ORDINAL}|\\.)?\\s+(?:of\\s+)?(${ANY_MONTH})\\b`,
    'i',
  ).exec(text);
  if (dayFirst) {
    return { month: monthOf(dayFirst[2]), day: Number(dayFirst[1]), year };
  }
  const numeric = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})?/.exec(text);
  if (numeric && Number(numeric[2]) <= 12) {
    return {
      month: Number(numeric[2]),
      day: Number(numeric[1]),
      year: Number(numeric[3]) || year,
    };
  }
  return null;
};

/**
 * Patterns for every usual way of writing a month and day, with named
 * groups (`d` flag: their positions).
 */
const datePatterns = ({ month, day }) => {
  const names = namesOf(MONTHS[month - 1])
    .map(escapeRegExp)
    .join('|');
  const d = `0?${day}`;
  const m = `0?${month}`;
  return [
    [`\\b(?<month>${names})\\.?\\s+(?<day>${d})(?<ord>${ORDINAL})?\\b`],
    [
      `\\b(?<day>${d})(?<ord>${ORDINAL}|\\.)?\\s+(?:of\\s+)?(?<month>${names})\\b`,
    ],
    [`\\b(?<day>${d})\\.(?<mon>${m})\\.`],
    // Weak: also "slide 3/18", "the 18th century" (see WEAK_DATE)
    [`\\b(?<mon>${m})/(?<day>${d})\\b`, 'numeric'],
    [`\\bthe\\s+(?<day>${d})(?<ord>${ORDINAL})\\b`, 'day'],
  ].map(([source, weak]) => ({
    pattern: new RegExp(source, 'gid'),
    ...(weak ? { weak } : {}),
  }));
};

/**
 * What must follow a weak match to make it a date (D57, a code review):
 * a numeric one needs its year ("3/18/2027", not "slide 3/18"), a day
 * alone the end of a phrase or a date's word ("on the 18th?", "the 18th
 * of", not "the 18th century"). Weak matches without it are listed for
 * the editor, never changed.
 */
const WEAK_DATE = {
  numeric: /^\/\d{2,4}\b/,
  day: /^(?:\s*$|\s*[?.!,;:)\]]|\s+(?:of|at|from|to|until|and|or)\b)/i,
};

const words = (text) => text.split(/(\s+)/).filter(Boolean);
const EDGE = /^[\s,.;:!?·–-]+|[\s,.;:!?·–-]+$/g;

/** `find` without the words it shares with `replace` at either end. */
export const changedPart = (find, replace) => {
  const a = words(find);
  const b = words(replace);
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) {
    start += 1;
  }
  let end = 0;
  while (
    end < a.length - start &&
    end < b.length - start &&
    a[a.length - 1 - end] === b[b.length - 1 - end]
  ) {
    end += 1;
  }
  return a
    .slice(start, a.length - end)
    .join('')
    .trim()
    .replace(EDGE, '');
};

// Words a changed name or value may have (D52): a rewrite of a sentence
// or a whole text changed no single value to look for elsewhere
const MAX_CHANGED_WORDS = 4;

const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

/**
 * What a replacement changed: a date (old and new month and day, the
 * years where written) or words (old and new), or null when nothing
 * worth looking for is left. Only a value that actually changed counts
 * (D52): a date still in the new text was kept, a date without a new
 * one was dropped (a shortened text), and a long passage is a rewrite.
 */
export const changeOf = (find, replace) => {
  const oldPart = changedPart(find, replace) || find.trim();
  const newPart = changedPart(replace, find) || replace.trim();
  const old = dateIn(oldPart);
  if (old) {
    const next = dateIn(newPart) || dateIn(replace);
    const kept = datePatterns(old).some(({ pattern }) =>
      new RegExp(pattern.source, pattern.flags).test(replace),
    );
    if (!next || kept) return null;
    return {
      kind: 'date',
      old: { ...old, year: old.year ?? dateIn(find)?.year ?? null },
      next: { ...next, year: next.year ?? dateIn(replace)?.year },
    };
  }
  if (oldPart.replace(/[^\p{L}\p{N}]/gu, '').length < 3) return null;
  if (
    wordCount(oldPart) > MAX_CHANGED_WORDS ||
    wordCount(newPart) > MAX_CHANGED_WORDS
  ) {
    return null;
  }
  return { kind: 'text', old: oldPart, next: newPart };
};

/** Patterns that find what `change` replaced: `[{pattern}]`. */
export const patternsOf = (change) => {
  if (!change) return [];
  if (change.kind === 'date') return datePatterns(change.old);
  return [
    {
      pattern: new RegExp(
        `(?<![\\p{L}\\p{N}])${escapeRegExp(change.old)}(?![\\p{L}\\p{N}])`,
        'giu',
      ),
    },
  ];
};

/**
 * Does `text` bring back what a change of the turn replaced (D42)? Only
 * dates, names and numbers: a common word ("and" -> "or") may well come
 * back elsewhere.
 */
export const restoresOld = (text, changes) =>
  changes
    .filter(
      (change) =>
        change?.kind === 'date' ||
        (change?.kind === 'text' && /[\p{Lu}\p{N}]/u.test(change.old)),
    )
    .some((change) => {
      const has = (patterns) =>
        patterns.some(({ pattern }) => {
          pattern.lastIndex = 0;
          return pattern.test(text);
        });
      if (!change?.next || !has(patternsOf(change))) return false;
      const next =
        change.kind === 'date'
          ? patternsOf({ kind: 'date', old: change.next })
          : patternsOf({ kind: 'text', old: change.next });
      return !has(next);
    });

const ordinal = (day) => {
  if (day % 100 >= 11 && day % 100 <= 13) return 'th';
  return { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th';
};

const padded = (number) => number.length === 2 && number.startsWith('0');
const pad = (value, on) => (on && value < 10 ? `0${value}` : String(value));

/**
 * A date match written for the new date, in its own format: month name
 * in the same spelling and case, day with the right ordinal, numbers
 * padded as there (in 18.03. both are: the month shows it). Null when
 * the year changes (it is not in the match).
 */
const rewriteDate = (match, change) => {
  const { old, next } = change;
  if (!next) return null;
  if (old.year && next.year && old.year !== next.year) return null;
  const text = match[0];
  const offset = match.index;
  const { day, mon } = match.groups;
  const padDay = padded(day) || (mon !== undefined && padded(mon));
  const padMonth = mon !== undefined && (padded(mon) || padded(day));
  const edits = Object.entries(match.indices.groups)
    .filter(([, span]) => span)
    .map(([group, [start, end]]) => {
      const value = text.slice(start - offset, end - offset);
      let replacement = value;
      if (group === 'month') {
        const month = MONTHS[next.month - 1];
        replacement = capitalized(month[styleOf(value)], value);
      } else if (group === 'day') replacement = pad(next.day, padDay);
      else if (group === 'mon') replacement = pad(next.month, padMonth);
      else if (group === 'ord' && value !== '.')
        replacement = ordinal(next.day);
      return { start: start - offset, end: end - offset, replacement };
    })
    .sort((a, b) => b.start - a.start);
  return edits.reduce(
    (result, edit) =>
      result.slice(0, edit.start) + edit.replacement + result.slice(edit.end),
    text,
  );
};

const WEEKDAY_BEFORE = new RegExp(
  `(${[...WEEKDAYS.en, ...WEEKDAYS.de].join('|')}),?\\s+$`,
  'i',
);

/**
 * The weekday written right before a date match, and the new one: null
 * when there is none; `{missing: true}` when there is one but the new
 * year is unknown (then the suggestion cannot be computed).
 */
const weekdayBefore = (text, start, change) => {
  const before = WEEKDAY_BEFORE.exec(
    text.slice(Math.max(0, start - 16), start),
  );
  if (!before) return null;
  const { next } = change;
  const year = next.year ?? change.old.year;
  if (!year) return { missing: true };
  const name = before[1].toLowerCase();
  const language = WEEKDAYS.en.includes(name) ? 'en' : 'de';
  const index = new Date(Date.UTC(year, next.month - 1, next.day)).getUTCDay();
  return {
    start: start - before[0].length,
    replacement: before[0].replace(
      before[1],
      capitalized(WEEKDAYS[language][index], before[1]),
    ),
  };
};

/** The span around [start, end) that occurs only once in `text`. */
const uniqueAround = (text, start, end) => {
  let from = start;
  let to = end;
  const count = (piece) => text.split(piece).length - 1;
  while (count(text.slice(from, to)) > 1 && (from > 0 || to < text.length)) {
    const before = text.lastIndexOf(' ', Math.max(0, from - 2));
    from = before < 0 ? 0 : before + 1;
    const after = text.indexOf(' ', Math.min(text.length, to + 1));
    to = after < 0 ? text.length : after;
  }
  return [from, to];
};

// Characters of context shown around a place
const CONTEXT = 30;
// The most suggestions and places of one answer
export const MAX_LEFTOVERS = 20;

/** The text around [start, end), cut at whole words. */
export const excerpt = (text, start, end) => {
  let from = Math.max(0, start - CONTEXT);
  let to = Math.min(text.length, end + CONTEXT);
  if (from > 0) from = Math.min(start, text.indexOf(' ', from) + 1 || start);
  if (to < text.length) {
    const space = text.lastIndexOf(' ', to);
    to = space > end ? space : to;
  }
  return `${from > 0 ? '…' : ''}${text.slice(from, to)}${to < text.length ? '…' : ''}`;
};

/** Every changeable text of the page, with what the answer did to it. */
const textsOf = (page, profile, operations, changes) => {
  const rewritten = new Map(
    changes
      .filter(
        (c) =>
          !c.replacements &&
          (c.kind === 'page_field' ||
            (c.kind === 'block_field' && c.fieldKind !== 'styling')),
      )
      .map((c) => [c.key, c.value]),
  );
  const deleted = new Set(
    changes.filter((c) => c.kind === 'delete').map((c) => c.id),
  );
  // The spans each field's replacements cover, on its current text
  const replaced = new Map();
  operations
    .filter((op) => op.op === 'replace_text')
    .forEach((op) =>
      replaced.set(
        op.id ? `block:${op.id}:${op.field}` : `page:${op.field}`,
        op.replacements,
      ),
    );
  const texts = [];
  const add = (key, base, text) =>
    texts.push({
      key,
      ...base,
      text: rewritten.get(key) ?? text ?? '',
      rewritten: rewritten.has(key),
      spans: replaced.get(key) || [],
    });
  Object.entries(page.fields || {}).forEach(([field, text]) => {
    if (!profile.pageFields?.[field]) return;
    add(`page:${field}`, { label: field, field }, text);
  });
  const walk = (blocks) =>
    blocks.forEach((block) => {
      if (deleted.has(block.id)) return;
      if (!block.readonly) {
        Object.entries(block.fields || {}).forEach(([field, text]) => {
          if (block.locked?.[field]) return;
          add(
            `block:${block.id}:${field}`,
            { label: `${block.ref} ${field}`, ref: block.ref, field },
            text,
          );
        });
      }
      walk(block.children || []);
    });
  walk(page.blocks || []);
  return texts;
};

/** The model's replacements of the answer, as changes to look for. */
const changesOfAnswer = (operations) => [
  ...new Map(
    operations
      .filter((op) => op.op === 'replace_text')
      .flatMap((op) => op.replacements)
      .filter((replacement) => !replacement.suggested)
      .map((replacement) => [
        `${replacement.find}\u0000${replacement.replace}`,
        {
          ...changeOf(replacement.find, replacement.replace),
          category: replacement.category,
          // A suggestion says what changed, as the model's replacement
          reason: replacement.reason,
        },
      ])
      .filter(([, change]) => change.kind),
  ).values(),
];

/**
 * What the answer's replacements left (D42): `{suggestions, leftovers}`.
 * `suggestions` are `replace_text` operations to validate
 * (`raw`, `label`, `excerpt`); `leftovers`
 * places (`label`, `excerpt`) for the editor. `operations` are the
 * answer's valid ones, `changes` their changes.
 */
export const scanLeftovers = ({ page, profile, operations, changes }) => {
  const result = { suggestions: [], leftovers: [] };
  const answerChanges = changesOfAnswer(operations);
  if (!answerChanges.length) return result;
  // Dates with a year first: they claim a match written with a year,
  // which a yearless change only lists (D57)
  const searches = [...answerChanges]
    .sort(
      (a, b) =>
        (a.kind === 'date' && a.old.year ? 0 : 1) -
        (b.kind === 'date' && b.old.year ? 0 : 1),
    )
    .flatMap((change) =>
      patternsOf(change).map((search) => ({ ...search, change })),
    );
  textsOf(page, profile, operations, changes).forEach((entry) => {
    const { text, spans, rewritten, label } = entry;
    const taken = [];
    searches.forEach(({ pattern, change, weak }) => {
      pattern.lastIndex = 0;
      for (const match of text.matchAll(pattern)) {
        const start = match.index;
        const end = start + match[0].length;
        const covered = (span) => start < span.end && span.start < end;
        // Inside a replacement of the answer, or found by another pattern
        if (!rewritten && spans.some(covered)) continue;
        if (taken.some(covered)) continue;
        // Another year written with it ("March 18, 2026", "18.03.2026"):
        // another date, not the one replaced
        const year = YEAR_AFTER.exec(text.slice(end));
        if (
          change.kind === 'date' &&
          year &&
          change.old.year &&
          Number(year[1]) !== change.old.year
        ) {
          continue;
        }
        taken.push({ start, end });
        // `match`: the words found, highlighted in the review's quote
        const place = {
          label,
          excerpt: excerpt(text, start, end),
          match: match[0],
        };
        // Listed, not changed (D57): a weak match that is not clearly a
        // date, and a date with a year when the change had none (an
        // archive's "March 18, 2019" is another date)
        if (
          (weak && !WEAK_DATE[weak].test(text.slice(end))) ||
          (change.kind === 'date' && year && !change.old.year)
        ) {
          result.leftovers.push(place);
          continue;
        }
        let replacement = null;
        let from = start;
        if (!rewritten && change.kind === 'date') {
          replacement = rewriteDate(match, change);
          const weekday = replacement && weekdayBefore(text, start, change);
          if (weekday?.missing) replacement = null;
          else if (weekday) {
            replacement = weekday.replacement + replacement;
            from = weekday.start;
          }
        } else if (!rewritten && match[0] === change.old && change.next) {
          replacement = change.next;
        }
        if (replacement === null) {
          result.leftovers.push(place);
          continue;
        }
        const [s, e] = uniqueAround(text, from, end);
        result.suggestions.push({
          ...place,
          raw: {
            op: 'replace_text',
            ...(entry.ref ? { block: entry.ref } : {}),
            field: entry.field,
            find: text.slice(s, e),
            replace: text.slice(s, from) + replacement + text.slice(end, e),
            reason: change.reason || '',
            category: change.category,
          },
        });
      }
    });
  });
  result.suggestions = result.suggestions.slice(0, MAX_LEFTOVERS);
  result.leftovers = result.leftovers.slice(0, MAX_LEFTOVERS);
  return result;
};

// A relation a page states between two dates (D59): "one week before",
// "3 days after", "zwei Wochen vor"
const COUNTS = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  ein: 1,
  eine: 1,
  einen: 1,
  zwei: 2,
  drei: 3,
  vier: 4,
  fünf: 5,
  sechs: 6,
  sieben: 7,
  acht: 8,
  neun: 9,
  zehn: 10,
};
const RELATION = new RegExp(
  `\\b(\\d{1,2}|${Object.keys(COUNTS).join('|')})\\s+(days?|weeks?|tagen?|tage|wochen?)\\s+(before|after|prior\\s+to|vor|nach)\\b`,
  'giu',
);
// Any date written in a sentence: month and day, a year if written
const ANY_DATE = new RegExp(
  [
    `\\b(?<month>${ANY_MONTH})\\.?\\s+(?<day>\\d{1,2})${ORDINAL}?\\b`,
    `\\b(?<day2>\\d{1,2})(?:${ORDINAL}|\\.)?\\s+(?:of\\s+)?(?<month2>${ANY_MONTH})\\b`,
    `\\b(?<day3>\\d{1,2})\\.(?<mon3>\\d{1,2})\\.`,
  ].join('|'),
  'giu',
);

const dateOf = ({ year, month, day }) =>
  new Date(Date.UTC(year, month - 1, day));
const shifted = (date, days) => {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
};
const sameDay = (a, b) => a.getTime() === b.getTime();
const written = ({ month, day, year }) =>
  `${capitalized(MONTHS[month - 1].en, 'X')} ${day}, ${year}`;

/** The sentence of `text` around [start, end). */
const sentenceAround = (text, start, end) => {
  const before = text.slice(0, start);
  const from = Math.max(
    ...['. ', '! ', '? ', '\n'].map((mark) => {
      const at = before.lastIndexOf(mark);
      return at < 0 ? 0 : at + mark.length;
    }),
  );
  const after = text.slice(end).search(/[.!?](?:\s|$)|\n/);
  return [from, after < 0 ? text.length : end + after];
};

/**
 * Dates that depend on a date the answer changed (D59): "closes one week
 * before the event, on March 11" when the event moves from March 18 to
 * April 9, 2027. Computed only where the sentence states the relation and
 * it holds for the old values (March 11 is one week before March 18):
 * then the new date (April 2) is certain, not guessed. In the evals the
 * model left the deadline (5 of 10 runs) or got it wrong (March 25, March
 * 23); the check D57 removed flagged any date near a change.
 *
 * `{suggestions, corrections}`: `suggestions` replace a dependent date
 * nobody changed (like the leftovers'), `corrections` give the
 * operation `number` whose replacement wrote another date there and the
 * `replace` it should have.
 */
export const scanDependents = ({ page, profile, operations, changes }) => {
  const result = { suggestions: [], corrections: [] };
  const dated = changesOfAnswer(operations).filter(
    (change) => change.kind === 'date' && (change.old.year || change.next.year),
  );
  if (!dated.length) return result;
  // A date is computed once, though several replacements of the answer
  // change the same date (in its formats)
  const claimed = new Set();
  textsOf(page, profile, operations, changes).forEach((entry) => {
    const { text, spans, rewritten, label } = entry;
    if (rewritten) return;
    for (const relation of text.matchAll(RELATION)) {
      const count =
        Number(relation[1]) || COUNTS[relation[1].toLowerCase()] || 0;
      const days = count * (/^(week|woche)/i.test(relation[2]) ? 7 : 1);
      const sign = /^(before|prior|vor)/i.test(relation[3]) ? -1 : 1;
      const [from, to] = sentenceAround(
        text,
        relation.index,
        relation.index + relation[0].length,
      );
      const sentence = text.slice(from, to);
      for (const found of sentence.matchAll(ANY_DATE)) {
        const g = found.groups;
        const candidate = {
          month: monthOf(g.month || g.month2 || '') || Number(g.mon3),
          day: Number(g.day || g.day2 || g.day3),
        };
        if (!candidate.month || candidate.month > 12 || !days) continue;
        const start = from + found.index;
        const end = start + found[0].length;
        const writtenYear = YEAR_AFTER.exec(text.slice(end));
        dated.forEach((change) => {
          const year =
            Number(writtenYear?.[1]) || change.old.year || change.next.year;
          const old = { ...change.old, year: change.old.year || year };
          const next = { ...change.next, year: change.next.year || old.year };
          const before = shifted(dateOf(old), sign * days);
          if (!sameDay(dateOf({ ...candidate, year }), dateOf(before))) return;
          if (claimed.has(`${entry.key}:${start}`)) return;
          claimed.add(`${entry.key}:${start}`);
          const target = shifted(dateOf(next), sign * days);
          const reason = `${relation[0]} ${written(next)}: ${written(target)} (computed by the assistant)`;
          const covering = spans.find(
            (span) => span.start < end && start < span.end && !span.suggested,
          );
          if (covering) {
            // The model changed it: kept when right, corrected when not
            const theirs = dateIn(covering.replace);
            if (
              !theirs ||
              (theirs.month === target.month && theirs.day === target.day)
            ) {
              return;
            }
            const match = datePatterns(theirs)
              .map(({ pattern }) => {
                pattern.lastIndex = 0;
                return pattern.exec(covering.replace);
              })
              .find(Boolean);
            const rewrite =
              match &&
              rewriteDate(match, {
                old: { ...theirs, year: null },
                next: target,
              });
            if (!rewrite) return;
            result.corrections.push({
              number: covering.number,
              label,
              replace:
                covering.replace.slice(0, match.index) +
                rewrite +
                covering.replace.slice(match.index + match[0].length),
              detail: `${label}: ${written(target)}, not ${theirs.month}/${theirs.day}`,
            });
            return;
          }
          const match = datePatterns(candidate)
            .map(({ pattern }) => {
              pattern.lastIndex = start;
              const m = pattern.exec(text);
              return m && m.index === start ? m : null;
            })
            .find(Boolean);
          const replacement =
            match &&
            rewriteDate(match, {
              old: { ...candidate, year: writtenYear ? year : null },
              next: target,
            });
          const place = { label, excerpt: excerpt(text, start, end) };
          if (!replacement) return;
          const [s, e] = uniqueAround(text, start, end);
          result.suggestions.push({
            ...place,
            match: found[0],
            raw: {
              op: 'replace_text',
              ...(entry.ref ? { block: entry.ref } : {}),
              field: entry.field,
              find: text.slice(s, e),
              replace: text.slice(s, start) + replacement + text.slice(end, e),
              reason,
              category: 'outdated',
            },
          });
        });
      }
    }
  });
  return result;
};
