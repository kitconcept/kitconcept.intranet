/**
 * Reading the cases (`cases/*.case.json`). A case holds its form data, or
 * names a shared page with `formDataFile` (relative to the eval folder,
 * e.g. `pages/horizon-summit.json`): several cases test one real page.
 */
import fs from 'node:fs';
import path from 'node:path';

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** One case, its form data resolved. `root` is the eval folder. */
export const loadCase = (root, name) => {
  const testCase = readJson(path.join(root, 'cases', name));
  if (testCase.formDataFile && !testCase.formData) {
    testCase.formData = readJson(path.join(root, testCase.formDataFile));
  }
  return testCase;
};

/** Every case, in file order. */
export const loadCases = (root) =>
  fs
    .readdirSync(path.join(root, 'cases'))
    .filter((name) => name.endsWith('.case.json'))
    .sort()
    .map((name) => loadCase(root, name));
