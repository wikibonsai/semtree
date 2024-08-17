import { RGX_INDENT } from './const';


export const getIndentSize = (root: string, contentHash: Record<string, string[]>): number | string=> {
  let indentSize: number = -1;
  function calcSize(key: string): void {
    const lines: string[] = contentHash[key];
    lines.forEach((line, i) => {
      const indentMatch: RegExpMatchArray | null = line.match(RGX_INDENT);
      // calculates number of spaces
      if (indentMatch && indentMatch[0] && indentSize < 0) {
        indentSize = indentMatch[0].length;
      }
    });
  }
  calcSize(root);
  // if indentSize is still -1, try to find it in the other files
  if (indentSize == -1) {
    const trunkFiles: string[] = Object.keys(contentHash);
    for (const key of trunkFiles) {
      calcSize(key);
      if (indentSize > 0) { break; }
    }
    if (indentSize < 0) {
      return 'semtree.getIndentSize(): indentation could not be determined';
    }
  }
  return indentSize;
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
