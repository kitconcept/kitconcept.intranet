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
