import type { SemTreeOpts } from './types';


export const RGX_LVL = /^[ \t]*/;

export const defaultOpts: SemTreeOpts = {
  virtualTrunk: false,
  // lvlSize: 2,
  // lvlType: 'space',
  mkdnList: true,
  wikitext: true,
};
