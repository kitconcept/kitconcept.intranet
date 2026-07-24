import React from 'react';
import configureStore from 'redux-mock-store';
import { Provider } from 'react-intl-redux';
import type { Meta, StoryObj } from '@storybook/react';

import PersonPill from '@kitconcept/intranet/components/PersonPill/PersonPill';

const mockStore = configureStore();

//To demonstrate the "explicit portrait" path in Storybook.
const personImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect width="64" height="64" fill="#c8d3e0"/>
      <circle cx="32" cy="25" r="12" fill="#6b7d94"/>
      <path d="M12 60c0-13 9-20 20-20s20 7 20 20z" fill="#6b7d94"/>
    </svg>`,
  );

const withStore = (disableProfileLinks = false) => {
  const store = mockStore({
    site: {
      data: { 'kitconcept.clickable_profile_links': disableProfileLinks },
    },
    intl: {
      locale: 'en',
      messages: {},
    },
  });
  const Decorator = (Story: React.ComponentType) => (
    <Provider store={store}>
      <Story />
    </Provider>
  );
  return Decorator;
};

const meta: Meta<typeof PersonPill> = {
  title: 'Components/PersonPill',
  component: PersonPill,
  decorators: [withStore()],
  parameters: {
    docs: {
      description: {
        component:
          'Unified person representation: portrait + name, ' +
          'optionally linked to a profile. Covers Plone users, the Person content ' +
          'type, compact pills and normal-sized bylines/footers.',
      },
    },
  },
  argTypes: {
    id: { control: 'text' },
    fullname: { control: 'text' },
    name: { control: 'text' },
    portrait: { control: 'text' },
    url: { control: 'text' },
    compact: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof PersonPill>;

// Use case 1: Plone user — no URL → not clickable.
export const PloneUser: Story = {
  args: {
    id: 'anna',
    fullname: 'Anna Becker',
  },
};

// Use case 2: Person content type — explicit portrait + URL linking to profile.
export const PersonContentType: Story = {
  args: {
    id: 'ben',
    fullname: 'Ben Yilmaz',
    portrait: personImage,
    url: '/persons/ben',
  },
};

// Use case 3: compact pill — smaller variant for inline mentions.
export const CompactPill: Story = {
  args: {
    id: 'clara',
    fullname: 'Clara Nguyen',
    portrait: personImage,
    url: '/persons/clara',
    compact: true,
  },
};

// Use case 4: byline / footer — normal size (default).
export const Byline: Story = {
  args: {
    id: 'david',
    fullname: 'David Schmidt',
    url: '/persons/david',
  },
};

// Icon fallback when no portrait resolves.
export const IconFallback: Story = {
  args: {
    id: 'eva',
    fullname: 'Eva Roth',
  },
};

// Profile links disabled site-wide → renders as plain text even with a URL.
export const ProfileLinksDisabled: Story = {
  decorators: [withStore(true)],
  args: {
    id: 'ben',
    fullname: 'Ben Yilmaz',
    portrait: personImage,
    url: '/persons/ben',
  },
};
