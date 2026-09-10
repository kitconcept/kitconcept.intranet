import type { Locator, Page } from '@playwright/test';
import { expect, test } from './test';
import { login } from './login';
import { createContent } from './content';

/**
 * Acceptance coverage for the CLM `responsible_person` / `feedback_person`
 * person-vocabulary widgets, guarding two regressions:
 *
 *  1. A person widget must show the person's *name* after its value was
 *     changed and saved, not the raw UUID (issue #623). The `responsible_person`
 *     case is covered by the `InheritedFieldWrapper` label resolution; the plain
 *     `feedback_person` autocomplete depends on the core Volto fix
 *     (https://github.com/plone/volto/pull/8423) and stays `fixme` until the
 *     volto pin includes it.
 *  2. The `responsible_person` inheritance hint must only appear when the value
 *     is genuinely inherited from an ancestor — never for a content's own
 *     value, including right after the value is cleared.
 */

const MAX = {
  id: 'clm-person-max',
  first: 'Max',
  last: 'Berger',
  name: 'Max Berger',
};
const ANNA = {
  id: 'clm-person-anna',
  first: 'Anna',
  last: 'Becker',
  name: 'Anna Becker',
};

const UUID_RE = /^[0-9a-f]{32}$/;

async function createPerson(
  page: Page,
  person: { id: string; first: string; last: string; name: string },
) {
  const response = await createContent(page, {
    contentType: 'Person',
    contentId: person.id,
    contentTitle: person.name,
    bodyModifier: (body) => ({
      ...body,
      first_name: person.first,
      last_name: person.last,
    }),
  });
  const data = (await response.json()) as { UID: string };
  return data.UID;
}

/**
 * The CLM fields live in the metadata sidebar under the "CLM" fieldset. For a
 * Page the metadata sidebar with the CLM fieldset is shown by default, but be
 * defensive and open it if the widget is not visible yet.
 */
async function revealField(page: Page, fieldName: string): Promise<Locator> {
  const control = page.locator(
    `.field-wrapper-${fieldName} .react-select__control`,
  );

  if (!(await control.isVisible().catch(() => false))) {
    const pageTab = page.getByRole('button', { name: 'Page', exact: true });
    if (await pageTab.isVisible().catch(() => false)) {
      await pageTab.click();
    }
    const clmFieldset = page
      .locator('.accordion .title', { hasText: 'CLM' })
      .first();
    if (await clmFieldset.isVisible().catch(() => false)) {
      await clmFieldset.click();
    }
  }

  await expect(control).toBeVisible();
  return page.locator(`.field-wrapper-${fieldName}`);
}

async function clearSelect(field: Locator) {
  const clear = field.locator('.react-select__clear-indicator');
  // The clear (✕) indicator only renders once the value itself has rendered.
  // Wait for it so the click cannot race the value still resolving, then
  // confirm the value is actually gone before continuing.
  await expect(clear).toBeVisible();
  await clear.click();
  await expect(field.locator('.react-select__single-value')).toHaveCount(0);
  await expect(field.locator('.react-select__placeholder')).toBeVisible();
}

async function pickPerson(
  page: Page,
  field: Locator,
  search: string,
  optionLabel: string,
) {
  if (await field.locator('.react-select__single-value').count()) {
    await clearSelect(field);
  }
  // Click the control to focus the (otherwise zero-width) input, then type via
  // the keyboard — clicking the input directly is intercepted by the react-select
  // placeholder.
  await field.locator('.react-select__control').click();
  await page.keyboard.type(search, { delay: 20 });
  await page.locator('.react-select__option', { hasText: optionLabel }).click();
  await expect(field.locator('.react-select__single-value')).toHaveText(
    optionLabel,
  );
}

async function saveEditForm(page: Page) {
  await page.getByRole('button', { name: 'Save' }).click();
  // Volto redirects to the view once the save succeeds.
  await expect(page.getByRole('link', { name: 'Edit' })).toBeVisible();
}

test.describe('CLM person widgets', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('responsible_person keeps showing the name after the value is changed and saved', async ({
    page,
  }) => {
    const maxUID = await createPerson(page, MAX);
    await createPerson(page, ANNA);
    await createContent(page, {
      contentType: 'Document',
      contentId: 'clm-responsible-doc',
      contentTitle: 'CLM responsible document',
      bodyModifier: (body) => ({ ...body, responsible_person: maxUID }),
    });

    await page.goto('/clm-responsible-doc/edit', { waitUntil: 'networkidle' });

    let field = await revealField(page, 'responsible_person');
    await expect(field.locator('.react-select__single-value')).toHaveText(
      MAX.name,
    );

    // Replace Max with Anna and save (the reported #623 reproduction).
    await pickPerson(page, field, ANNA.first, ANNA.name);
    await saveEditForm(page);

    // Re-enter edit mode via client-side navigation (the Redux vocabulary
    // cache survives, which is exactly what used to make the widget fall back
    // to the raw UUID).
    await page.getByRole('link', { name: 'Edit' }).click();

    field = await revealField(page, 'responsible_person');
    const value = field.locator('.react-select__single-value');
    await expect(value).toHaveText(ANNA.name);
    await expect(value).not.toHaveText(UUID_RE);
  });

  // `feedback_person` is a plain (unwrapped) autocomplete, so it depends on the
  // core Volto fix in https://github.com/plone/volto/pull/8423. Enable this
  // once the volto pin in mrs.developer.json includes that fix; until then it
  // fails against the pinned 19.3.1.
  test.fixme(
    'feedback_person keeps showing the name after the value is changed and saved',
    async ({ page }) => {
      const maxUID = await createPerson(page, MAX);
      await createPerson(page, ANNA);
      await createContent(page, {
        contentType: 'Document',
        contentId: 'clm-feedback-doc',
        contentTitle: 'CLM feedback document',
        bodyModifier: (body) => ({ ...body, feedback_person: maxUID }),
      });

      await page.goto('/clm-feedback-doc/edit', { waitUntil: 'networkidle' });

      let field = await revealField(page, 'feedback_person');
      await expect(field.locator('.react-select__single-value')).toHaveText(
        MAX.name,
      );

      await pickPerson(page, field, ANNA.first, ANNA.name);
      await saveEditForm(page);

      await page.getByRole('link', { name: 'Edit' }).click();

      field = await revealField(page, 'feedback_person');
      const value = field.locator('.react-select__single-value');
      await expect(value).toHaveText(ANNA.name);
      await expect(value).not.toHaveText(UUID_RE);
    },
  );

  test('responsible_person shows the name for a content own value and no inheritance hint', async ({
    page,
  }) => {
    const maxUID = await createPerson(page, MAX);
    await createContent(page, {
      contentType: 'Document',
      contentId: 'clm-own-doc',
      contentTitle: 'CLM own document',
      bodyModifier: (body) => ({ ...body, responsible_person: maxUID }),
    });

    await page.goto('/clm-own-doc/edit', { waitUntil: 'networkidle' });

    const field = await revealField(page, 'responsible_person');
    await expect(field.locator('.react-select__single-value')).toHaveText(
      MAX.name,
    );

    // The value belongs to this content itself, so no inheritance hint.
    await expect(page.getByText('Inherited Content Owner:')).toHaveCount(0);

    // Clearing the value must not surface a bogus inheritance hint either
    // (there is no ancestor providing a value).
    await clearSelect(field);
    await expect(page.getByText('from the parent content:')).toHaveCount(0);
  });

  test('responsible_person shows the inheritance hint when the value comes from an ancestor', async ({
    page,
  }) => {
    const maxUID = await createPerson(page, MAX);
    await createContent(page, {
      contentType: 'Document',
      contentId: 'clm-parent-doc',
      contentTitle: 'CLM parent document',
      bodyModifier: (body) => ({ ...body, responsible_person: maxUID }),
    });
    await createContent(page, {
      contentType: 'Document',
      contentId: 'child',
      contentTitle: 'CLM child document',
      path: 'clm-parent-doc',
    });

    await page.goto('/clm-parent-doc/child/edit', { waitUntil: 'networkidle' });

    const field = await revealField(page, 'responsible_person');

    // No own value on the child.
    await expect(field.locator('.react-select__single-value')).toHaveCount(0);

    // The inheritance hint resolves the ancestor's person name (not the UUID)
    // and links to the parent content.
    const hint = field.getByText('Inherited Content Owner:');
    await expect(hint).toBeVisible();
    await expect(field).toContainText(MAX.name);
    await expect(field).toContainText('from the parent content:');
    await expect(
      field.getByRole('link', { name: '/clm-parent-doc' }),
    ).toBeVisible();
  });
});
