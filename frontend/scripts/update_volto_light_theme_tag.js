#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const PACKAGE_NAME = '@kitconcept/volto-light-theme';
const MRS_CONFIG_KEY = 'volto-light-theme';

function toPythonStyleTag(version) {
  return version.replace(
    /^(\d+\.\d+\.\d+)-(alpha|beta|rc)\.(\d+)$/,
    (_, base, pre, num) => {
      const marker = pre === 'alpha' ? 'a' : pre === 'beta' ? 'b' : 'rc';
      return `${base}${marker}${num}`;
    },
  );
}

function latestPublishedVersion(packageName) {
  const stdout = execFileSync('pnpm', ['view', packageName, 'time', '--json'], {
    encoding: 'utf8',
  });
  const payload = JSON.parse(stdout);
  const versions = Object.entries(payload).filter(
    ([version]) => version !== 'created' && version !== 'modified',
  );

  if (!versions.length) {
    throw new Error(`No published versions found for ${packageName}`);
  }

  versions.sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());
  return versions[versions.length - 1][0];
}

function updateMrsDeveloper(tag) {
  const frontendDir = path.resolve(__dirname, '..');
  const mrsPath = path.join(frontendDir, 'mrs.developer.json');
  const data = JSON.parse(fs.readFileSync(mrsPath, 'utf8'));

  if (!(MRS_CONFIG_KEY in data)) {
    throw new Error(`Entry '${MRS_CONFIG_KEY}' not found in ${mrsPath}`);
  }

  const currentTag = data[MRS_CONFIG_KEY].tag;
  if (currentTag === tag) {
    console.log(`${PACKAGE_NAME} is already set to ${tag}`);
    return;
  }

  data[MRS_CONFIG_KEY].tag = tag;
  fs.writeFileSync(mrsPath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`Updated ${PACKAGE_NAME} tag: ${currentTag} -> ${tag}`);
}

function main() {
  try {
    const latestVersion = latestPublishedVersion(PACKAGE_NAME);
    const tag = toPythonStyleTag(latestVersion);
    updateMrsDeveloper(tag);
  } catch (error) {
    console.error(error.message || String(error));
    process.exitCode = 1;
  }
}

main();
