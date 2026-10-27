/**
 * Capture the site profile (AI_WORKFLOW.md D28) the AI panel builds from
 * the live configuration, for the eval. Against the acceptance stack (its
 * database is reset before and after):
 *
 *   make acceptance-backend-start / acceptance-frontend-dev-start
 *   cd frontend && node eval/scripts/snapshot-profile.mjs eval/profiles/intranet.json
 *
 * Opens an edit form with `aiEditDebug` on and saves what the panel logs.
 * Regenerate it whenever the block configuration, volto-light-theme or
 * buildProfile changes; review the diff before committing it.
 */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const API = process.env.API_PATH || 'http://127.0.0.1:55001/plone';
const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
const AUTH = 'Basic ' + Buffer.from('admin:secret').toString('base64');
const robot = (keyword) =>
  fetch(`${API}/RobotRemote`, {
    method: 'POST',
    headers: { 'content-type': 'text/xml' },
    body: `<?xml version="1.0"?><methodCall><methodName>run_keyword</methodName><params><param><value><string>${keyword}</string></value></param><param><value><array><data><value><string>plone.app.robotframework.testing.PLONE_ROBOT_TESTING</string></value></data></array></value></param></params></methodCall>`,
  });
const json = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: AUTH,
};

await robot('remote_zodb_teardown');
await robot('remote_zodb_setup');
try {
  let r = await fetch(`${API}/@controlpanels/intranet-settings`, {
    method: 'PATCH',
    headers: json,
    body: JSON.stringify({ enable_ai_edit: true }),
  });
  if (!r.ok) throw new Error(`controlpanel ${r.status}`);
  r = await fetch(API, {
    method: 'POST',
    headers: json,
    body: JSON.stringify({
      '@type': 'Document',
      id: 'snap',
      title: 'Snapshot',
    }),
  });
  if (!r.ok) throw new Error(`create ${r.status}`);
  const { token } = await (
    await fetch(`${API}/@login`, {
      method: 'POST',
      headers: json,
      body: JSON.stringify({ login: 'admin', password: 'secret' }),
    })
  ).json();
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([
    { name: 'auth_token', value: token, url: FRONTEND },
  ]);
  await context.addInitScript(() => localStorage.setItem('aiEditDebug', '1'));
  const page = await context.newPage();
  const profile = new Promise((resolve) =>
    page.on('console', async (msg) => {
      if (
        msg.type() === 'debug' &&
        msg.text().startsWith('AI assistant: profile')
      ) {
        const args = msg.args();
        resolve({
          profile: await args[2].jsonValue(),
          skipped: await args[4].jsonValue(),
        });
      }
    }),
  );
  await page.goto(`${FRONTEND}/snap/edit`, { waitUntil: 'networkidle' });
  await page
    .locator('#sidebar .ui.menu .item')
    .getByText('AI Editing', { exact: true })
    .click();
  const result = await Promise.race([
    profile,
    new Promise((_, no) =>
      setTimeout(() => no(new Error('no profile logged')), 20000),
    ),
  ]);
  writeFileSync(
    process.argv[2],
    JSON.stringify(result.profile, null, 2) + '\n',
  );
  console.log(
    'types:',
    Object.keys(result.profile.blockTypes).length,
    'skipped:',
    JSON.stringify(result.skipped),
  );
  await browser.close();
} finally {
  await robot('remote_zodb_teardown');
}
