import type { SemTreeOpts } from './types';


export const defaultOpts: SemTreeOpts = {
  delimiter: 'semtree',
  virtualTrunk: false,
  indentSize: 2,
  indentKind: 'space',
  mkdnBullet: true,
  wikiLink: true,
};

export const RGX_INDENT       = /^[ \t]*/;
export const RGX_INDENT_SPACE = /^ +/;
export const RGX_INDENT_TAB   = /^\t+/;
export const RGX_MKDN_BLT     = /^[-+*] /;
export const RGX_WIKI         = /\[\[.*?\]\]/;
export const RGX_WIKI_OPEN    = /\[\[/;
export const RGX_WIKI_CLOSE = /\]\]/;
