import type { SemTreeOpts } from './types';


export const REGEX = {
  LEVEL           : /^[ \t]*/,                                                 // todo: link
  TEXT_WITH_LOC   : /([^\\:^|[\]]+)-(\d+)-(\d+)/i,                             // wikirefs.RGX.VALID_CHARS.FILENAME-line_num-level
  TEXT_WITH_ID    :  /([^\\:^|[\]]+)-\(([A-Za-z0-9]{5})\)/i,                   // wikirefs.RGX.VALID_CHARS.FILENAME-(id/disambiguation)
  WIKITEXT_WITH_ID:  /([+*-]) \[\[([^\\:\\^|[\]]+)-\(([A-Za-z0-9]{5})\)\]\]/i, // wikirefs.RGX.VALID_CHARS.FILENAME-(id/disambiguation)
  WHITESPACE      : /^\s*$/,
} as const;

export const defaultOpts: SemTreeOpts = {
  virtualTrunk: false,
  chunkSize: 2,
  mkdnList: true,
  wikitext: true,
};
