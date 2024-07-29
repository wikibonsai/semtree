import { REGEX } from './const';


export const deepcopy = (item: any) => {
  // 🦨
  return JSON.parse(JSON.stringify(item));
};

export const getChunkSize = (lines: string[]) => {
  let chunkSize: number = -1;
  // calculate chunk size (number of spaces per level) and size of deepest level
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lines.forEach((line, i) => {
    const levelMatch: RegExpMatchArray | null = line.match(REGEX.LEVEL);
    // calculates number of spaces
    if (levelMatch && chunkSize < 0) {
      const whitespace = levelMatch[0];
      if (whitespace[0] == ' ') {
        chunkSize = whitespace.length;
      }
      if (whitespace[0] == '\t') {
        const tabSize: number = 1;
        chunkSize = tabSize;
      }
    }
  });
  return chunkSize;
};

export const getMaxLevel = (lines: string[], chunkSize: number) => {
  let level: number = -1;
  let levelMax: number = -1;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  lines.forEach((line, i) => {
    const levelMatch: RegExpMatchArray | null = line.match(REGEX.LEVEL);
    // calculates number of spaces
    if (levelMatch) {
      level = (levelMatch[0].length / chunkSize) + 1;
    }
    levelMax = (level > levelMax) ? level : levelMax;
  });
  return levelMax;
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

// todo: add linting options (tab/space, indent size)
export const lint = (content: string | Record<string, string>): void | string => {
  let chunkSize: number = -1;
  let previousIndent: number = 0;
  const badIndentations: { fname?: string, line: number; content: string; reason: string }[] = [];
  const entities: Set<string> = new Set();
  const duplicates: { fname?: string, line: number; content: string }[] = [];
  // linting per line
  const lintLine = (line: string, lineNumber: number, fname?: string) => {
    if (line.length > 0) {
      // indentation check
      const match: RegExpMatchArray | null = line.match(REGEX.LEVEL);
      const currentIndent: number = match ? match[0].length : 0;
      // improper indentation
      if (currentIndent % chunkSize !== 0) {
        badIndentations.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
          reason: 'inconsistent indentation',
        });
      } else if (currentIndent > previousIndent + chunkSize) {
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
                                     .replace(REGEX.LEVEL, '')
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
    chunkSize = getChunkSize(lines);
    for (let i = 0; i < lines.length; i++) {
      lintLine(lines[i], i + 1);
    }
  // multi file
  } else {
    for (const [filename, fileContent] of Object.entries(content)) {
      const lines: string[] = fileContent.split('\n');
      chunkSize = getChunkSize(lines);
      previousIndent = 0; // Reset for each file
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