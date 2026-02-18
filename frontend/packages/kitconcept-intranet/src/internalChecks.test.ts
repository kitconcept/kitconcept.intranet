import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const recommendedAddonsPath = path.resolve(
  __dirname,
  '../../..',
  'packages/volto-light-theme/recommendedAddons.json',
);
const mrsDeveloperPath = path.resolve(
  __dirname,
  '../../..',
  'mrs.developer.json',
);
const intranetPackagePath = path.resolve(__dirname, '..', 'package.json');

const readJSON = <T>(filePath: string): T =>
  JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const normalizeVersion = (version: unknown) =>
  typeof version === 'string' ? version.replace(/^[\\^~]/, '') : version;

const excludedPackages = new Set([
  '@eeacms/volto-accordion-block',
  '@plonegovbr/volto-social-media',
  '@kitconcept/volto-dsgvo-banner',
]);

describe('internal checks', () => {
  it('keeps recommended add-ons in sync with mrs.developer.json and intranet package.json', () => {
    const recommendedAddons = readJSON<Record<string, string>>(
      recommendedAddonsPath,
    );
    const mrsDeveloper = readJSON<Record<string, unknown>>(mrsDeveloperPath);
    const intranetPackage = readJSON<{
      dependencies?: Record<string, string>;
      addons?: string[];
    }>(intranetPackagePath);

    const mrsByPackage = Object.entries(mrsDeveloper).reduce<
      Record<
        string,
        Record<string, unknown> & { configKey: string; package?: string }
      >
    >((acc, [configKey, configValue]) => {
      if (
        configValue &&
        typeof configValue === 'object' &&
        'package' in configValue
      ) {
        acc[String((configValue as Record<string, unknown>).package)] = {
          ...(configValue as Record<string, unknown>),
          configKey,
        };
      }
      return acc;
    }, {});

    const issues: string[] = [];
    const intranetDependencies = intranetPackage.dependencies || {};
    const intranetAddons = intranetPackage.addons || [];

    Object.entries(recommendedAddons).forEach(
      ([packageName, recommendedVersion]) => {
        if (excludedPackages.has(packageName)) return;

        const mrsEntry = mrsByPackage[packageName];

        if (!mrsEntry) {
          issues.push(
            `${packageName} is listed in recommendedAddons.json but missing from frontend/mrs.developer.json.`,
          );
          return;
        }

        const mrsVersion =
          (mrsEntry.tag as string | undefined) ||
          (mrsEntry.branch as string | undefined) ||
          (mrsEntry.version as string | undefined);

        if (!mrsVersion) {
          issues.push(
            `${packageName} (${mrsEntry.configKey}) has no tag, branch, or version specified in frontend/mrs.developer.json.`,
          );
          return;
        }

        const normalizedRecommended = normalizeVersion(recommendedVersion);
        const normalizedMrsVersion = normalizeVersion(mrsVersion);

        if (
          recommendedVersion !== mrsVersion &&
          normalizedRecommended !== normalizedMrsVersion
        ) {
          issues.push(
            `${packageName} differs: recommendedAddons.json=${recommendedVersion} vs frontend/mrs.developer.json(${mrsEntry.configKey})=${mrsVersion}.`,
          );
        }
      },
    );

    Object.entries(recommendedAddons).forEach(([packageName]) => {
      if (excludedPackages.has(packageName)) return;

      const dependencyVersion = intranetDependencies[packageName];

      if (!dependencyVersion) {
        issues.push(
          `${packageName} is listed in recommendedAddons.json but missing from frontend/packages/kitconcept-intranet/package.json dependencies.`,
        );
        return;
      }

      if (dependencyVersion !== 'workspace:*') {
        issues.push(
          `${packageName} is pinned to a specific version in frontend/packages/kitconcept-intranet/package.json dependencies; expected 'workspace:*'.`,
        );
      }
    });

    Object.keys(recommendedAddons).forEach((packageName) => {
      if (excludedPackages.has(packageName)) return;

      if (!intranetAddons.includes(packageName)) {
        issues.push(
          `${packageName} is listed in recommendedAddons.json but missing from frontend/packages/kitconcept-intranet/package.json addons.`,
        );
      }
    });

    expect(issues).toEqual([]);
  });
});
