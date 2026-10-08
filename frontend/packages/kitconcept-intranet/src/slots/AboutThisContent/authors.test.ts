import { describe, expect, it } from 'vitest';
import { getDisplayedAuthors } from './authors';

describe('getDisplayedAuthors', () => {
  it('returns all expanded CLM authors in their configured order', () => {
    expect(
      getDisplayedAuthors({
        authors: ['person-1', 'person-2'],
        creators: ['creator'],
        '@components': {
          clm: {
            authors: [
              {
                value: 'person-2',
                title: 'Second Author',
                username: 'second',
                person_url: 'http://localhost:8080/Plone/people/second',
              },
              {
                value: 'person-1',
                title: 'First Author',
                username: 'first',
                person_url: 'http://localhost:8080/Plone/people/first',
              },
            ],
          },
          byline: {
            users: { creator: { fullname: 'Content Creator' } },
          },
        },
      }),
    ).toEqual([
      {
        id: 'first',
        name: 'First Author',
        url: 'http://localhost:8080/Plone/people/first',
      },
      {
        id: 'second',
        name: 'Second Author',
        url: 'http://localhost:8080/Plone/people/second',
      },
    ]);
  });

  it('falls back to creators when CLM authors are not set', () => {
    expect(
      getDisplayedAuthors({
        authors: null,
        creators: ['creator'],
        '@components': {
          byline: {
            users: {
              creator: {
                fullname: 'Content Creator',
              },
            },
          },
        },
      }),
    ).toEqual([
      {
        id: 'creator',
        name: 'Content Creator',
      },
    ]);
  });
});
