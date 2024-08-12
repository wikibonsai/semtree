import { RGX_LVL } from './const';


export const getLevelSize = (root: string, contentHash: Record<string, string[]>): number | string=> {
  let lvlSize: number = -1;
  function calcSize(key: string): void {
    const lines: string[] = contentHash[key];
    lines.forEach((line, i) => {
      const levelMatch: RegExpMatchArray | null = line.match(RGX_LVL);
      // calculates number of spaces
      if (levelMatch && levelMatch[0] && lvlSize < 0) {
        lvlSize = levelMatch[0].length;
      }
    });
  }
  calcSize(root);
  // if lvlSize is still -1, try to find it in the other files
  if (lvlSize == -1) {
    const trunkFiles: string[] = Object.keys(contentHash);
    for (const key of trunkFiles) {
      calcSize(key);
      if (lvlSize > 0) { break; }
    }
    if (lvlSize < 0) {
      return 'semtree.getLevelSize(): indentation could not be determined -- is it possible no root exists?';
    }
  }
  return lvlSize;
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
