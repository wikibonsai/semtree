import type { SemTreeOpts } from './types';


export const RGX_INDENT = /^[ \t]*/;

export const defaultOpts: SemTreeOpts = {
  virtualTrunk: false,
  // indentSize: 2,
  // indentKind: 'space',
  mkdnList: true,
  wikitext: true,
};
