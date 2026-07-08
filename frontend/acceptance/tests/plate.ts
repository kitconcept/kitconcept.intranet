import type { Locator, Page } from '@playwright/test';

declare global {
  interface Window {
    platePlaywrightAdapter?: {
      EDITABLE_TO_EDITOR?: WeakMap<HTMLElement, unknown>;
    };
  }
}

export type WaitForPlateEditorReadyOptions = {
  timeout?: number;
};

/**
 * Wait until:
 * - the Slate editable is visible
 * - `window.platePlaywrightAdapter` exists
 * - the adapter WeakMap has the editable -> editor mapping
 *
 * This avoids races with lazy-loaded editors and `useEffect` timing.
 */
export async function waitForPlateEditorReady(
  page: Page,
  editable: Locator = page.locator('.slate-editor[data-slate-editor]'),
  { timeout = 10_000 }: WaitForPlateEditorReadyOptions = {},
) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const handles = await editable.elementHandles();

    if (handles.length > 0) {
      const ready = await page.evaluate((elements) => {
        const adapter = window.platePlaywrightAdapter;
        if (!adapter?.EDITABLE_TO_EDITOR) return false;

        const isVisible = (el: HTMLElement) => {
          const rect = el.getBoundingClientRect();
          if (!rect.width && !rect.height) return false;
          const style = window.getComputedStyle(el);
          return style.visibility !== 'hidden' && style.display !== 'none';
        };

        return elements.some(
          (el) =>
            isVisible(el as HTMLElement) &&
            adapter.EDITABLE_TO_EDITOR?.has(el as HTMLElement),
        );
      }, handles);

      if (ready) {
        return editable;
      }
    }

    await page.waitForTimeout(100);
  }

  throw new Error(
    'waitForPlateEditorReady: timed out waiting for a visible editor mapped in the Playwright adapter',
  );
}
