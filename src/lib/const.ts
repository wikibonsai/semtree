import type { SemTreeOpts } from './types';


export const defaultOpts: SemTreeOpts = {
  delimiter: 'semtree',
  virtualBranches: false,
  indentSize: 2,
  indentKind: 'space',
  mkdnBullet: true,
  wikiLink: true,
};

export const RGX_INDENT      : RegExp = /^[ \t]*/;
export const RGX_INDENT_SPACE: RegExp = /^ +/;
export const RGX_INDENT_TAB  : RegExp = /^\t+/;
export const RGX_MKDN_BLT    : RegExp = /^[-+*] /;
export const RGX_WIKI        : RegExp = /\[\[.*?\]\]/;
export const RGX_WIKI_OPEN   : RegExp = /\[\[/;
export const RGX_WIKI_CLOSE  : RegExp = /\]\]/;
