import { RGX_LVL } from './const';
import { getLevelSize } from './func';


// todo: add tab/space linting option?
export const lint = (
  content: string | Record<string, string>,
  lvlSize: number = -1,
): void | string => {
  let previousIndent: number = 0;
  const badIndentations: { fname?: string, line: number; content: string; reason: string }[] = [];
  const entities: Set<string> = new Set();
  const duplicates: { fname?: string, line: number; content: string }[] = [];
  // linting per line
  const lintLine = (line: string, lineNumber: number, fname?: string) => {
    if (line.length > 0) {
      // indentation check
      const match: RegExpMatchArray | null = line.match(RGX_LVL);
      const currentIndent: number = match ? match[0].length : 0;
      // improper indentation
      if (currentIndent % lvlSize !== 0) {
        badIndentations.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
          reason: 'inconsistent indentation',
        });
      } else if (currentIndent > previousIndent + lvlSize) {
        badIndentations.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
          reason: 'over-indented',
        });
      }
      previousIndent = currentIndent;
      // duplicate check
      /* eslint-disable indent */
      const entityName: string = line.trim()
                                     // strip indentation
                                     .replace(RGX_LVL, '')
                                     // strip markdown bullets
                                     .replace(/[-*+] /, '')
                                     // strip wikiref markers
                                     .replace(/\[\[/, '')
                                     .replace(/\]\]/, '');
      /* eslint-enable indent */
      if (entities.has(entityName)) {
        duplicates.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: entityName,
        });
      } else {
        entities.add(entityName);
      }
    }
  };
  // single file
  if (typeof content === 'string') {
    const lines: string[] = content.split('\n');
    lvlSize = getLevelSize(lines);
    for (let i = 0; i < lines.length; i++) {
      lintLine(lines[i], i + 1);
    }
  // multi file
  } else {
    for (const [filename, fileContent] of Object.entries(content)) {
      const lines: string[] = fileContent.split('\n');
      // only calculate lvlSize if it's the first file
      if (lvlSize < 0) {
        lvlSize = getLevelSize(lines);
      }
      previousIndent = 0; // reset for each file
      for (let i = 0; i < lines.length; i++) {
        lintLine(lines[i], i + 1, filename);
      }
    }
  }
  // errors
  let errorMsg: string = '';
  if (badIndentations.length > 0) {
    errorMsg += 'semtree.lint(): improper indentation found:\n\n';
    badIndentations.forEach(({ fname, line, content, reason }) => {
      errorMsg += fname
        ? `- File "${fname}" Line ${line} (${reason}): "${content}"\n`
        : `- Line ${line} (${reason}): "${content}"\n`;
    });
  }
  if (duplicates.length > 0) {
    errorMsg += 'semtree.lint(): duplicate entity names found:\n\n';
    duplicates.forEach(({ fname, line, content }) => {
      errorMsg += fname
        ? `- File "${fname}" Line ${line}: "${content}"\n`
        : `- Line ${line}: "${content}"\n`;
    });
  }
  return errorMsg || undefined;
};
