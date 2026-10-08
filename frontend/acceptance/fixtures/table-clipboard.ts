/**
 * Clipboard payloads for table paste, after Aurora's
 * `packages/plate/acceptance/fixtures/clipboard.ts`.
 */

/**
 * A table as Confluence puts it on the clipboard (only the table selected):
 * `confluenceTable` markup, header cells, bold, a link and a list in a cell.
 */
export const CONFLUENCE_TABLE_HTML = `<meta charset="utf-8"><div class="table-wrap"><table class="confluenceTable"><colgroup><col><col><col></colgroup><tbody>
<tr><th class="confluenceTh"><p>KIP</p></th><th class="confluenceTh"><p>Title</p></th><th class="confluenceTh"><p>Release</p></th></tr>
<tr><td class="confluenceTd"><p><a href="https://cwiki.apache.org/confluence/display/KAFKA/KIP-1">KIP-1</a></p></td><td class="confluenceTd"><p><strong>Remove</strong> the broker config</p></td><td class="confluenceTd"><p>0.8</p></td></tr>
<tr><td class="confluenceTd"><p>KIP-2</p></td><td class="confluenceTd"><ul><li>First point</li><li>Second point</li></ul></td><td class="confluenceTd"><p>0.9</p></td></tr>
</tbody></table></div>`;

/** A table copied from a web page (Wikipedia style, with a header row). */
export const WEB_TABLE_HTML = `<meta charset="utf-8"><table class="wikitable sortable"><tbody>
<tr><th>#</th><th>Bundesland</th><th>Fläche in km²</th></tr>
<tr><td>1</td><td><a href="https://de.wikipedia.org/wiki/Bayern">Bayern</a></td><td>70.541,57</td></tr>
<tr><td>2</td><td><a href="https://de.wikipedia.org/wiki/Niedersachsen">Niedersachsen</a></td><td>47.709,80</td></tr>
</tbody></table>`;

/**
 * A range as Excel puts it on the clipboard: plain cells, the first row is
 * not a header (bold by style only).
 */
export const EXCEL_HTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta name=ProgId content=Excel.Sheet><meta name=Generator content="Microsoft Excel 15"></head><body link="#0563C1" vlink="#954F72">
<table border=0 cellpadding=0 cellspacing=0 width=256 style='border-collapse:collapse;width:192pt'>
<!--StartFragment-->
 <col width=128 span=2 style='width:96pt'>
 <tr height=20 style='height:15.0pt'><td height=20 class=xl65 width=128 style='height:15.0pt;width:96pt;font-weight:700'>Artikel</td><td class=xl65 width=128 style='width:96pt;font-weight:700'>Menge</td></tr>
 <tr height=20 style='height:15.0pt'><td height=20 style='height:15.0pt'>Pipetten</td><td align=right>12</td></tr>
 <tr height=20 style='height:15.0pt'><td height=20 style='height:15.0pt'>Handschuhe</td><td align=right>200</td></tr>
<!--EndFragment-->
</table></body></html>`;

/** A markdown table as plain text (pasted with ⌘⇧V / from a plain-text source). */
export const MARKDOWN_TABLE_TEXT = `| Spalte A | Spalte B |
| --- | --- |
| eins | **zwei** |`;
