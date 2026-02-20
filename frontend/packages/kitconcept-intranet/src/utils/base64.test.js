import { describe, expect, it } from 'vitest';

import { toBase64Latin1, toBase64Unicode } from './base64';

const fromBase64Unicode = (value) => {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};
const fromBase64Latin1 = (value) => atob(value);

describe('toBase64Unicode', () => {
  it('round-trips UTF-8 text including umlauts', () => {
    const payload = {
      params: {
        sSearchTerm: 'Österreich',
      },
    };
    const encoded = toBase64Unicode(JSON.stringify(payload));
    const decoded = JSON.parse(fromBase64Unicode(encoded));

    expect(decoded.params.sSearchTerm).toBe('Österreich');
  });

  it('round-trips multi-byte UTF-8 characters', () => {
    const payload = {
      params: {
        sSearchTerm: 'Ö ä ñ 漢字 ✅',
      },
    };
    const encoded = toBase64Unicode(JSON.stringify(payload));
    const decoded = JSON.parse(fromBase64Unicode(encoded));

    expect(decoded.params.sSearchTerm).toBe('Ö ä ñ 漢字 ✅');
  });
});

describe('toBase64Latin1', () => {
  it('keeps umlauts intact when the decoder reads Latin-1', () => {
    const payload = {
      params: {
        sSearchTerm: 'Österreich',
      },
    };
    const encoded = toBase64Latin1(JSON.stringify(payload));
    const decoded = JSON.parse(fromBase64Latin1(encoded));

    expect(decoded.params.sSearchTerm).toBe('Österreich');
  });

  it('shows the utf-8 mismatch under Latin-1 decoding', () => {
    const payload = {
      params: {
        sSearchTerm: 'Österreich',
      },
    };
    const encoded = toBase64Unicode(JSON.stringify(payload));
    const decoded = JSON.parse(fromBase64Latin1(encoded));

    expect(decoded.params.sSearchTerm).toBe('Ãsterreich');
  });
});
