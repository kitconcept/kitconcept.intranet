import { describe, expect, it } from 'vitest';
import { groupByDay, type Notification } from './helpers';

const at = (created: string) => ({ id: created, created }) as Notification;

describe('groupByDay', () => {
  it('groups newest-first items into today, yesterday and dates', () => {
    const now = new Date(2026, 10, 16, 12, 0);
    const groups = groupByDay(
      [
        at(new Date(2026, 10, 16, 9, 0).toISOString()),
        at(new Date(2026, 10, 16, 8, 0).toISOString()),
        at(new Date(2026, 10, 15, 18, 0).toISOString()),
        at(new Date(2026, 10, 10, 18, 0).toISOString()),
      ],
      now,
    );
    expect(groups.map((g) => g.key)).toEqual([
      'today',
      'yesterday',
      expect.stringMatching(/^2026-11-1\d$/),
    ]);
    expect(groups[0].items).toHaveLength(2);
  });
});
