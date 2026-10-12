import { describe, expect, it } from 'vitest';
import { htmlIsPlainText } from './pasteFromCodeEditor';

describe('htmlIsPlainText', () => {
  it('accepts what VS Code and Cursor put on the clipboard', () => {
    expect(
      htmlIsPlainText(
        `<meta charset='utf-8'><div style="color: #d4d4d4;background-color: #1e1e1e;white-space: pre;"><div><span style="color: #d4d4d4;">| a | b |</span></div><br><div><span>| 1 | 2 |</span></div></div>`,
      ),
    ).toBe(true);
    expect(htmlIsPlainText('')).toBe(true);
  });

  it('rejects HTML with tables or formatting', () => {
    expect(htmlIsPlainText('<table><tr><td>1</td></tr></table>')).toBe(false);
    expect(htmlIsPlainText('<p><strong>fett</strong></p>')).toBe(false);
    expect(htmlIsPlainText('<div><a href="/x">Link</a></div>')).toBe(false);
    expect(htmlIsPlainText('<ul><li>eins</li></ul>')).toBe(false);
    expect(htmlIsPlainText('<h2>Titel</h2>')).toBe(false);
  });
});
