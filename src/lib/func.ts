import { REGEX } from './const';


export const deepcopy = (item: any) => {
  // 🦨
  return JSON.parse(JSON.stringify(item));
};

export const getChunkSize = (lines: string[]): number => {
  let chunkSize: number = -1;
  // calculate chunk size (number of spaces per level) and size of deepest level
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lines.forEach((line, i) => {
    const levelMatch: RegExpMatchArray | null = line.match(REGEX.LEVEL);
    // calculates number of spaces
    if (levelMatch && chunkSize < 0) {
      const whitespace: string = levelMatch[0];
      if (whitespace[0] == ' ') {
        chunkSize = whitespace.length;
      }
      if (whitespace[0] == '\t') {
        const tabs: string = levelMatch[0];
        chunkSize = tabs.length;
      }
    }
  });
  return chunkSize;
};

export const getWhitespaceSize = (whitespace: string): number => {
  if (whitespace.includes(' ')) {
    return whitespace.length;
  }
  if (whitespace.includes('\t')) {
    const tabSize: number = 1;
    return whitespace.length * tabSize;
  }
  return whitespace.length;
};

export const rawText = (fullText: string, hasBullets: boolean = false): string => {
  // wiki markers
  const openBrackets: string = '[[';
  const closeBrackets: string = ']]';
  // mkdn list bullet markers
  const markdownBulletAsterisk: string = '* ';
  const markdownBulletDash: string = '- ';
  const markdownBulletPlus: string = '+ ';

  function isMarkdownBullet(text: string): boolean {
    return ((text === markdownBulletAsterisk)
          || (text === markdownBulletDash)
          || (text === markdownBulletPlus));
  }
  // strip markdown list marker if it exists
  fullText = (hasBullets && isMarkdownBullet(fullText.substring(0, 2))) ? fullText.slice(2, fullText.length) : fullText;
  // strip wikistring special chars and line breaks (see: https://stackoverflow.com/a/10805292)
  return fullText.replace(openBrackets, '').replace(closeBrackets, '').replace(/\r?\n|\r/g, '');
};
