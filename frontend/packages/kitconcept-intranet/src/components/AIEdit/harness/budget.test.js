import { describe, expect, it } from 'vitest';
import { MAX_TURNS, fitMessages, turnsOf } from './budget';

const user = (content) => ({ role: 'user', content });
const assistant = (content, calls) => ({
  role: 'assistant',
  content,
  ...(calls ? { tool_calls: [{ id: 'c', function: { name: 'x' } }] } : {}),
});
const tool = { role: 'tool', tool_call_id: 'c', content: 'Applied: b2.' };

describe('turnsOf', () => {
  it('keeps a call and its result in the turn of their request (D33)', () => {
    const messages = [user('a'), assistant('', true), tool, user('b')];
    expect(turnsOf(messages)).toEqual([
      [user('a'), assistant('', true), tool],
      [user('b')],
    ]);
  });
});

describe('fitMessages', () => {
  const long = 'x'.repeat(3000);
  const conversation = [
    user(long),
    assistant('', true),
    tool,
    user(long),
    assistant('ok'),
    user('current'),
  ];

  it('sends everything without a context length, up to the turn limit', () => {
    const many = Array.from({ length: MAX_TURNS + 2 }, (_, i) => user(`q${i}`));
    const fitted = fitMessages({ messages: many });
    expect(fitted.messages).toHaveLength(MAX_TURNS);
    expect(fitted.messages[0].content).toBe('q2');
    expect(fitted.droppedTurns).toBe(2);
  });

  it('drops the oldest whole turns until the request fits', () => {
    // (2000 - 0) tokens * 3 chars: room for one long turn, not two
    const fitted = fitMessages({
      messages: conversation,
      contextLength: 2000,
      charsPerToken: 3,
    });
    expect(fitted.droppedTurns).toBe(1);
    expect(fitted.messages.map((m) => m.role)).toEqual([
      'user',
      'assistant',
      'user',
    ]);
  });

  it('never drops the current turn; a request that cannot fit is refused', () => {
    expect(
      fitMessages({
        messages: [user('current')],
        pageChars: 10000,
        contextLength: 4000,
        reserveTokens: 1000,
      }),
    ).toEqual({ tooLong: true });
  });
});
