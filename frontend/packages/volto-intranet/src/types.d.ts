import type { StyleDefinition } from '@plone/types';

export type MutatorDSL = Record<
  string,
  {
    disable?: boolean;
    variations?: string[];
    themes?: StyleDefinition[];
  }
>;

export type BlocksConfigSettings = {
  blocks_config_mutator: MutatorDSL;
};

export type CustomInheritBehavior<T> = {
  data: T;
  from: {
    '@id': string;
    title: string;
  };
};

export type StickyMenuSettings = {
  sticky_menu: Array<iconLink>;
  sticky_menu_color: string;
  sticky_menu_foreground_color: string;
};