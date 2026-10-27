import { describe, expect, it } from 'vitest';
import {
  changeOf,
  changedPart,
  dateIn,
  patternsOf,
  restoresOld,
  scanLeftovers,
} from './leftovers';
import { createValidator } from './operations';
import { projectPage } from './projection';
import { toChanges } from './changes';
import { profile } from './__fixtures__/pages';

describe('dateIn', () => {
  it('reads month, day and year in the usual formats', () => {
    expect(dateIn('Thursday, March 18, 2027')).toEqual({
      month: 3,
      day: 18,
      year: 2027,
    });
    expect(dateIn('on the 18th of March')).toEqual({
      month: 3,
      day: 18,
      year: null,
    });
    expect(dateIn('am 18. März')).toMatchObject({ month: 3, day: 18 });
    expect(dateIn('18.03.2027')).toEqual({ month: 3, day: 18, year: 2027 });
    expect(dateIn('Room 18.5')).toBeNull();
  });
});

describe('changedPart and changeOf', () => {
  it('keep what a replacement changed', () => {
    expect(changedPart('on March 18, 2027', 'on April 9, 2027')).toBe(
      'March 18',
    );
    expect(changedPart('Nimbus Labs', 'Cirrus Labs')).toBe('Nimbus');
    expect(changeOf('on March 18, 2027', 'on April 9, 2027')).toEqual({
      kind: 'date',
      old: { month: 3, day: 18, year: 2027 },
      next: { month: 4, day: 9, year: 2027 },
    });
    expect(changeOf('Nimbus Labs', 'Cirrus Labs')).toEqual({
      kind: 'text',
      old: 'Nimbus',
      next: 'Cirrus',
    });
    expect(changeOf('a', 'b')).toBeNull();
  });

  it('follow only a value that changed (D52)', () => {
    // A shortened text keeps the date, or drops it: nothing to look for
    const intro =
      'Hey everyone, the summit is going to take place on March 18, 2027 at the hall, and there will be talks and workshops for everyone.';
    expect(
      changeOf(intro, 'The summit takes place on March 18, 2027 at the hall.'),
    ).toBeNull();
    expect(changeOf(intro, 'Talks and workshops at the hall.')).toBeNull();
    // A rewritten sentence is no name to look for elsewhere
    expect(
      changeOf(
        'drop us a line or swing by our office',
        'contact us or visit our office',
      ),
    ).toBeNull();
  });
});

describe('patternsOf', () => {
  const matches = (find, replace, text) =>
    patternsOf(changeOf(find, replace)).flatMap(({ pattern }) =>
      [...text.matchAll(pattern)].map((m) => m[0]),
    );

  it('finds a date in every usual format, nothing else', () => {
    expect(
      matches(
        'Thursday, March 18',
        'Friday, April 9',
        'March 18, Mar 18th, 18 March, 18. März, 18.03.2027, 3/18, the 18th; not March 19, 18.04., the 8th',
      ),
    ).toEqual([
      'March 18',
      'Mar 18th',
      '18 March',
      '18. März',
      '18.03.',
      '3/18',
      'the 18th',
    ]);
  });

  it('finds other words whole', () => {
    expect(
      matches('Nimbus Labs', 'Cirrus Labs', 'Nimbus, NimbusX, nimbus'),
    ).toEqual(['Nimbus', 'nimbus']);
  });
});

describe('restoresOld', () => {
  const turn = [changeOf('Thursday, March 18, 2027', 'Friday, April 9, 2027')];

  it('finds the old value in another format, unless the new one is there', () => {
    // The third browser test's repair: the old date, reformatted
    expect(restoresOld('on 18.03.2027 at the hall', turn)).toBe(true);
    expect(restoresOld('moved from March 18 to April 9', turn)).toBe(false);
    expect(restoresOld('on April 9, 2027', turn)).toBe(false);
  });

  it('ignores common words', () => {
    expect(restoresOld('this and that', [changeOf('and', 'or')])).toBe(false);
  });
});

describe('scanLeftovers', () => {
  const para = (text) => ({
    '@type': 'slate',
    value: [{ type: 'p', children: [{ text }] }],
  });
  // The summit page, shortened
  const formData = {
    title: 'Horizon Summit 2027',
    blocks: {
      hosted: para('Hosted by Nimbus Labs · Thursday, March 18, 2027 · Hall'),
      about: para(
        "It takes place on March 18, 2027. Last year's summit was on March 19, 2026. Registration closes one week before the event, on March 11. Early-bird pricing until January 31, 2027.",
      ),
      day: para('**Thursday, March 18**'),
      missed: para("Can't make it on the 18th? Recordings follow."),
      parking: para('Parking is free on March 18 – show your badge.'),
      footer: para('Horizon Summit 2027 · 18.03.2027 · © Nimbus Labs'),
    },
    blocks_layout: {
      items: ['hosted', 'about', 'day', 'missed', 'parking', 'footer'],
    },
  };
  const scan = (...raws) => {
    const links = {};
    const { page } = projectPage({ formData, profile, links });
    const { valid } = createValidator({ page, profile, links })(
      raws.map((raw, index) => ({
        raw: { reason: 'New date.', category: 'outdated', ...raw },
        number: index + 1,
      })),
    );
    return scanLeftovers({
      page,
      profile,
      operations: valid,
      changes: toChanges(valid, { page }).changes,
    });
  };
  const replace = (block, find, to) => ({
    op: 'replace_text',
    block,
    find,
    replace: to,
  });

  it('suggests the missed mentions in their own format (third browser test)', () => {
    const result = scan(
      replace('b1', 'Thursday, March 18, 2027', 'Friday, April 9, 2027'),
      replace('b3', 'Thursday, March 18', 'Friday, April 9'),
      replace('b4', 'on the 18th', 'on the 9th'),
      replace('b6', '18.03.2027', '09.04.2027'),
    );
    expect(
      result.suggestions.map(({ raw }) => [raw.block, raw.find, raw.replace]),
    ).toEqual([
      ['b2', 'March 18', 'April 9'],
      ['b5', 'March 18', 'April 9'],
    ]);
    // With the reason of the replacement it repeats: the review says
    // what changed, the same way for all
    expect(result.suggestions[0].raw).toMatchObject({
      op: 'replace_text',
      field: 'text',
      category: 'outdated',
      reason: 'New date.',
    });
    expect(result.leftovers).toEqual([]);
    // Dates that may depend on the change are not looked for (D57)
    expect(result.dependents).toBeUndefined();
  });

  it('writes weekdays and day-only mentions for the new date', () => {
    const result = scan(replace('b2', 'on March 18, 2027', 'on April 9, 2027'));
    const byBlock = Object.fromEntries(
      result.suggestions.map(({ raw }) => [raw.block, [raw.find, raw.replace]]),
    );
    expect(byBlock).toEqual({
      b1: ['Thursday, March 18', 'Friday, April 9'],
      b3: ['Thursday, March 18', 'Friday, April 9'],
      b4: ['the 18th', 'the 9th'],
      b5: ['March 18', 'April 9'],
      b6: ['18.03.', '09.04.'],
    });
  });

  it('lists what it cannot compute: another year, another case', () => {
    const years = scan(replace('b6', '18.03.2027', '09.04.2028'));
    expect(years.suggestions).toEqual([]);
    expect(years.leftovers.map((place) => place.label)).toEqual([
      'b1 text',
      'b2 text',
      'b3 text',
      'b4 text',
      'b5 text',
    ]);
    const names = scan(replace('b1', 'Nimbus Labs', 'Cirrus Labs'));
    expect(names.suggestions.map(({ raw }) => [raw.block, raw.find])).toEqual([
      ['b6', 'Nimbus'],
    ]);
  });

  it('changes only what is clearly the date (D57, a code review)', () => {
    const page = {
      blocks: {
        now: para('The summit is on March 18.'),
        century: para('An 18th-century hall: the 18th century, slide 3/18.'),
        day: para('See you on the 18th! Or on 3/18/2027, the 18th of March.'),
        archive: para('The first one was on March 18, 2019.'),
      },
      blocks_layout: { items: ['now', 'century', 'day', 'archive'] },
    };
    const links = {};
    const { page: projected } = projectPage({ formData: page, profile, links });
    const { valid } = createValidator({ page: projected, profile, links })([
      {
        raw: {
          op: 'replace_text',
          block: 'b1',
          find: 'March 18',
          replace: 'April 9',
          reason: 'New date.',
          category: 'outdated',
        },
        number: 1,
      },
    ]);
    const result = scanLeftovers({
      page: projected,
      profile,
      operations: valid,
      changes: toChanges(valid, { page: projected }).changes,
    });
    // Suggested: day-only mentions before punctuation or "of", a
    // numeric date with its year
    expect(
      result.suggestions.map(({ raw }) => [raw.block, raw.find, raw.replace]),
    ).toEqual([
      ['b3', '18th of March', '9th of April'],
      // In "3/18/2027": the year stays
      ['b3', '3/18', '4/9'],
      ['b3', 'on the 18th!', 'on the 9th!'],
    ]);
    // Listed, not changed: "the 18th century", "slide 3/18", and a
    // date with a year when the change had none
    expect(result.leftovers.map(({ match }) => match)).toEqual([
      '3/18',
      'the 18th',
      'March 18',
    ]);
  });

  it('leaves a date of another year alone', () => {
    const years = {
      blocks: {
        now: para('The summit is on March 18, 2027.'),
        last: para('Last year: March 18, 2026, and 18.03.2026 in short.'),
        bare: para('Free parking on March 18.'),
      },
      blocks_layout: { items: ['now', 'last', 'bare'] },
    };
    const links = {};
    const { page } = projectPage({ formData: years, profile, links });
    const { valid } = createValidator({ page, profile, links })([
      {
        raw: {
          op: 'replace_text',
          block: 'b1',
          find: 'March 18, 2027',
          replace: 'April 9, 2027',
          reason: 'New date.',
          category: 'outdated',
        },
        number: 1,
      },
    ]);
    const result = scanLeftovers({
      page,
      profile,
      operations: valid,
      changes: toChanges(valid, { page }).changes,
    });
    expect(result.suggestions.map(({ raw }) => raw.block)).toEqual(['b3']);
    expect(result.leftovers).toEqual([]);
  });

  it('looks for nothing without replacements', () => {
    expect(
      scan({ op: 'edit_block', block: 'b1', fields: { text: 'Hi.' } }),
    ).toEqual({ suggestions: [], leftovers: [] });
  });
});
