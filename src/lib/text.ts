import { RGX_INDENT } from './const';


export const checkComment = (line: string): boolean => {
  return line.trim().startsWith('<!--') && line.trim().endsWith('-->');
};

export const getLevel = (line: string, indentSize: number): number => {
  const match = line.match(RGX_INDENT);
  return match ? Math.floor(match[0].length / indentSize) : 0;
};

export const rawText = (
  fullText: string,
  {
    hasBullets = false,
    hasWiki = false,
  }: { hasBullets?: boolean, hasWiki?: boolean },
): string => {
  function isMarkdownBullet(text: string): boolean {
    return ((text === '* ') || (text === '- ') || (text === '+ '));
  }
  // strip markdown list marker if it exists
  fullText = (hasBullets && isMarkdownBullet(fullText.substring(0, 2)))
    ? fullText.slice(2, fullText.length)
    : fullText;
  // strip wikistring special chars
  fullText = hasWiki
    ? fullText.replace('[[', '').replace(']]', '')
    : fullText;
  // strip linebreaks (see: https://stackoverflow.com/a/10805292)
  return fullText.replace(/\r?\n|\r/g, '');
};
