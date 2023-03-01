export const openBrackets = '[[';
export const closeBrackets = ']]';

const markdownBulletAsterisk = '* ';
const markdownBulletDash = '- ';
const markdownBulletPlus = '+ ';

export function isMarkdownBullet(text: string): boolean {
  return ((text === markdownBulletAsterisk)
        || (text === markdownBulletDash)
        || (text === markdownBulletPlus));
}

export const REGEX = {
  LEVEL           : /^[ \t]*/,                                                 // todo: link
  TEXT_WITH_LOC   : /([^\\:^|[\]]+)-(\d+)-(\d+)/i,                             // wikirefs.RGX.VALID_CHARS.FILENAME-line_num-level
  TEXT_WITH_ID    :  /([^\\:^|[\]]+)-\(([A-Za-z0-9]{5})\)/i,                   // wikirefs.RGX.VALID_CHARS.FILENAME-(id/disambiguation)
  WIKITEXT_WITH_ID:  /([+*-]) \[\[([^\\:\\^|[\]]+)-\(([A-Za-z0-9]{5})\)\]\]/i, // wikirefs.RGX.VALID_CHARS.FILENAME-(id/disambiguation)
  WHITESPACE      : /^\s*$/,
} as const;
