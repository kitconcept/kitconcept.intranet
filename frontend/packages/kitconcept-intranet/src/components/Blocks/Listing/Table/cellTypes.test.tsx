import { afterEach, describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import config from '@plone/volto/registry';
import { cellTypes } from './cellTypes';

const linkCondition = (item: any, context: Record<string, any> = {}) =>
  (
    cellTypes.link.render('Title', {
      item: { '@id': '/item', ...item },
      isEditMode: false,
      ...context,
    }) as any
  ).props.condition;

describe('link cell type', () => {
  // Link items open their target, files download
  it('links through the item, like the other listing templates', () => {
    const item = { '@id': '/link', '@type': 'Link', remoteUrl: 'https://x' };
    const link = cellTypes.link.render('Link', {
      item,
      isEditMode: false,
    }) as any;
    expect(link.props.item).toBe(item);
  });

  it('links items in view mode', () => {
    expect(linkCondition({ '@type': 'Document' })).toBe(true);
  });

  it('does not link in edit mode', () => {
    expect(linkCondition({ '@type': 'Document' }, { isEditMode: true })).toBe(
      false,
    );
  });

  it('does not link Person items when the site turned off profile links', () => {
    expect(
      linkCondition({ '@type': 'Person' }, { showProfileLinks: false }),
    ).toBe(false);
    expect(
      linkCondition({ '@type': 'Document' }, { showProfileLinks: false }),
    ).toBe(true);
  });

  it('does not link Person items when the setting is null, like VLT', () => {
    expect(
      linkCondition({ '@type': 'Person' }, { showProfileLinks: null }),
    ).toBe(null);
  });

  it('links Person items when profile links are on or not configured', () => {
    expect(
      linkCondition({ '@type': 'Person' }, { showProfileLinks: true }),
    ).toBe(true);
    expect(linkCondition({ '@type': 'Person' })).toBe(true);
  });
});

describe('link cell type and Summary components', () => {
  afterEach(() => {
    delete config.components['Summary|Custom'];
  });

  it('does not link types whose Summary hides the link, like VLT', () => {
    const CustomSummary = Object.assign(() => null, { hideLink: true });
    config.registerComponent({
      name: 'Summary',
      component: CustomSummary,
      dependencies: ['Custom'],
    });
    expect(linkCondition({ '@type': 'Custom' })).toBe(false);
  });
});

describe('contentTypeIcon cell type', () => {
  it('shows the type title as text, never as markup', () => {
    const title = '<img src="x" onerror="alert(1)">';
    const { container } = render(
      <>
        {cellTypes.contentTypeIcon.render('Document', {
          item: { '@id': '/item', '@type': 'Document', type_title: title },
          isEditMode: false,
        })}
      </>,
    );
    const wrapper = container.querySelector('[role="img"]');
    expect(wrapper?.getAttribute('aria-label')).toBe(title);
    expect(wrapper?.getAttribute('title')).toBe(title);
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg title')).toBeNull();
  });
});
