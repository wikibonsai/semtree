import { RGX_LVL } from './const';


export const deepcopy = (item: any) => {
  // 🦨
  return JSON.parse(JSON.stringify(item));
};

export const getChunkSize = (lines: string[]): number => {
  let chunkSize: number = -1;
  // calculate chunk size (number of spaces per level) and size of deepest level
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lines.forEach((line, i) => {
    const levelMatch: RegExpMatchArray | null = line.match(RGX_LVL);
    // calculates number of spaces
    if (levelMatch && levelMatch[0] && chunkSize < 0) {
      chunkSize = levelMatch[0].length;
    }
  });
  return chunkSize;
};

export const rawText = (
  fullText: string,
  {
    hasBullets = false,
    hasWiki = false,
  }: { hasBullets?: boolean, hasWiki?: boolean },
): string => {
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
  fullText = (hasBullets && isMarkdownBullet(fullText.substring(0, 2)))
    ? fullText.slice(2, fullText.length)
    : fullText;
  // strip wikistring special chars
  fullText = hasWiki
    ? fullText.replace(openBrackets, '').replace(closeBrackets, '')
    : fullText;
  // strip linebreaks (see: https://stackoverflow.com/a/10805292)
  return fullText.replace(/\r?\n|\r/g, '');
};
