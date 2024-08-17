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
