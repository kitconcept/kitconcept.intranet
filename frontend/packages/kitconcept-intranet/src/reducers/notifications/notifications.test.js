import { describe, expect, it } from 'vitest';
import notifications from './notifications';
import {
  GET_NOTIFICATIONS,
  MARK_NOTIFICATIONS_READ,
} from '../../constants/ActionTypes';

const item = (id, read = false) => ({ id, read });

function loaded(items, unread) {
  return notifications(undefined, {
    type: `${GET_NOTIFICATIONS}_SUCCESS`,
    subrequest: 'list',
    result: { items, items_total: items.length, unread },
  });
}

describe('notifications reducer', () => {
  it('stores a subrequest and the unread count', () => {
    const state = loaded([item('a'), item('b', true)], 1);
    expect(state.unread).toBe(1);
    expect(state.subrequests.list.items).toHaveLength(2);
    expect(state.subrequests.list.loaded).toBe(true);
  });

  it('marks one as read and lowers the count once', () => {
    let state = loaded([item('a'), item('b')], 2);
    const action = { type: `${MARK_NOTIFICATIONS_READ}_SUCCESS`, ids: ['a'] };
    state = notifications(state, action);
    expect(state.unread).toBe(1);
    expect(state.subrequests.list.items[0].read).toBe(true);
    // Marking the same item again does not lower the count further.
    state = notifications(state, action);
    expect(state.unread).toBe(1);
  });

  it('marks all as read', () => {
    let state = loaded([item('a'), item('b')], 2);
    state = notifications(state, {
      type: `${MARK_NOTIFICATIONS_READ}_SUCCESS`,
    });
    expect(state.unread).toBe(0);
    expect(state.subrequests.list.items.every((i) => i.read)).toBe(true);
  });
});
