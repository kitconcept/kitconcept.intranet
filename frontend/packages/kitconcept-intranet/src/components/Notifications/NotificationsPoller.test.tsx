import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import NotificationsPoller from './NotificationsPoller';
import { POLL_INTERVAL } from './helpers';

const { dispatch, session } = vi.hoisted(() => ({
  dispatch: vi.fn(),
  session: { token: 'token' as string | undefined },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => dispatch,
  useSelector: (selector: any) => selector({ userSession: session }),
}));

let visibility: DocumentVisibilityState = 'visible';

function setVisibility(state: DocumentVisibilityState) {
  visibility = state;
  act(() => {
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

function renderPoller() {
  return render(
    <MemoryRouter>
      <NotificationsPoller />
    </MemoryRouter>,
  );
}

describe('NotificationsPoller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    dispatch.mockClear();
    session.token = 'token';
    visibility = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(
      () => visibility,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches on mount and polls while visible', () => {
    renderPoller();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0].request.path).toContain(
      '/@notifications?b_size=5',
    );
    vi.advanceTimersByTime(POLL_INTERVAL * 2);
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it('stops polling while hidden and refreshes when shown again', () => {
    renderPoller();
    setVisibility('hidden');
    vi.advanceTimersByTime(POLL_INTERVAL * 5);
    expect(dispatch).toHaveBeenCalledTimes(1);

    setVisibility('visible');
    expect(dispatch).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(POLL_INTERVAL);
    expect(dispatch).toHaveBeenCalledTimes(3);
  });

  it('fetches once in a tab opened in the background, then waits', () => {
    visibility = 'hidden';
    renderPoller();
    vi.advanceTimersByTime(POLL_INTERVAL * 3);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('does nothing without a user, and stops on unmount', () => {
    session.token = undefined;
    renderPoller().unmount();
    expect(dispatch).not.toHaveBeenCalled();

    session.token = 'token';
    const { unmount } = renderPoller();
    unmount();
    setVisibility('visible');
    vi.advanceTimersByTime(POLL_INTERVAL * 3);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });
});
