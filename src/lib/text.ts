import * as caml from 'caml-mkdn';
import matter from 'gray-matter';
import * as wikirefs from 'wikirefs';
import { RGX_INDENT } from './const';


// tree text

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

// attrs

export const stripAttrs = (content: Record<string, string[]>, delimiter: string = 'semtree'): Record<string, string[]> => {
  const extractedContent: Record<string, string[]> = {};
  for (const [key, text] of Object.entries(content)) {
    let content = text.join('\n');
    // first, check semtree markers
    const semtreeRegex = new RegExp(`<!--<${delimiter}>-->([\\s\\S]*?)<!--</${delimiter}>-->`, 's');
    const semtreeMatch = content.match(semtreeRegex);
    if (semtreeMatch) {
      // clean semtree markers
      content = semtreeMatch[1].trim();
    } else {
      // second, if no semtree markers, strip CAML and YAML
      const camlData: any = caml.load(content);
      const cleanerContent: string = camlData.content ? camlData.content : content;
      const cleanererContent: string = stripWikiAttrs(cleanerContent);
      const yamlData: any = (content.substring(0,4) === '---\n') ? matter(cleanererContent) : { data: {}, content: cleanererContent };
      const cleanContent: string = yamlData.content;
      content = cleanContent;
    }
    // finally, remove any leading/trailing newlines
    /* eslint-disable indent */
    extractedContent[key] = content.split('\n')
                                   .filter((line, index, array) => line.trim().length > 0);
    /* eslint-enable indent */
  }
  return extractedContent;
};

// todo: remove when caml supports wikiattrs
export const stripWikiAttrs = (text: string): string => {
  const results: any[] = wikirefs.scan(text, { kind: 'wikiattr' });
  results.sort((a, b) => b.start - a.start);
  let strippedText: string = text;
  for (const result of results) {
    strippedText = strippedText.slice(0, result.start) + strippedText.slice(result.start + result.text.length);
  }
  return strippedText;
};