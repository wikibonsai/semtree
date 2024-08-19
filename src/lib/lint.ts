import type { LintOpts } from './types';
import { defaultOpts, RGX_INDENT } from './const';


export const lint = (
  content: string | Record<string, string>,
  options: LintOpts,
): void | { warn: string, error: string } => {
  // const indentKind = 'space';
  /* @ts-expect-error: options.indentSize is optional */
  const indentSize: number = options.indentSize ?? defaultOpts.indentSize;
  /* @ts-expect-error: options.mkdnList is optional */
  const mkdnList: boolean = options.mkdnList ?? defaultOpts.mkdnList;
  /* @ts-expect-error: options.wikitext is optional */
  const wikitext: boolean = options.wikitext ?? defaultOpts.wikitext;
  // warnings
  const badIndentations: { fname?: string, line: number; content: string; reason: string }[] = [];
  // Update the entities type
  const orphanTrunks: string[] = [];
  const entities: Map<string, { occurrences: { fname?: string, line: number }[] }> = new Map();
  const duplicates: { fname?: string, line: number; content: string }[] = [];
  const markdownWarnings: { fname?: string, line: number; content: string }[] = [];
  const wikitextWarnings: { fname?: string, line: number; content: string }[] = [];
  // regex
  const bulletRegex = /^[-+*]\s/;
  const wikitextRegex = /\[\[.*?\]\]/;
  // state
  let previousIndent: number = 0;
  // linting per line
  const lintLine = (line: string, lineNumber: number, fname?: string) => {
    if (line.length > 0) {
      // indentation check
      const match: RegExpMatchArray | null = line.match(RGX_INDENT);
      const currentIndent: number = match ? match[0].length : 0;
      // improper indentation
      if (currentIndent % indentSize !== 0) {
        badIndentations.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
          reason: 'inconsistent indentation',
        });
      } else if (currentIndent > previousIndent + indentSize) {
        badIndentations.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
          reason: 'over-indented',
        });
      }
      previousIndent = currentIndent;
      const trimmedLine: string = line.trim();
      // markdown bullet check
      const hasBullet: boolean = bulletRegex.test(trimmedLine);
      if ((currentIndent > 0) && (hasBullet !== mkdnList)) {
        markdownWarnings.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
        });
      }
      // wikitext check
      const hasWikitext: boolean = wikitextRegex.test(trimmedLine);
      if ((currentIndent > 0) && (hasWikitext !== wikitext)) {
        wikitextWarnings.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
        });
      }
      // duplicate check
      /* eslint-disable indent */
      const entityName: string = line.trim()
                                     // strip indentation
                                     .replace(RGX_INDENT, '')
                                     // strip markdown bullets
                                     .replace(/[-*+] /, '')
                                     // strip wikiref markers
                                     .replace(/\[\[/, '')
                                     .replace(/\]\]/, '');
      /* eslint-enable indent */
      if (entities.has(entityName)) {
        const entityInfo = entities.get(entityName)!;
        entityInfo.occurrences.push({ fname, line: lineNumber });
        duplicates.push({
          fname: fname ?? '',
          line: lineNumber,
          content: entityName,
        });
      } else {
        entities.set(entityName, { occurrences: [{ fname, line: lineNumber }] });
      }
    }
  };

  // single file
  if (typeof content === 'string') {
    const lines: string[] = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      lintLine(lines[i], i + 1);
    }
  // multi file
  } else {
    for (const [filename, fileContent] of Object.entries(content)) {
      const lines: string[] = fileContent.split('\n');
      previousIndent = 0; // reset for each file
      for (let i = 0; i < lines.length; i++) {
        lintLine(lines[i], i + 1, filename);
      }
    }
    // if a root is given we can check for unused trunk files
    if (options.root) {
      // track trunk/index usage
      const contentKeys: string[] = Object.keys(content);
      // remove root from contentKeys
      const rootIndex: number = contentKeys.indexOf(options.root ?? '');
      if (rootIndex !== -1) {
        contentKeys.splice(rootIndex, 1);
      }
      for (const key of contentKeys) {
        if (!entities.has(key)) {
          orphanTrunks.push(key);
        }
      }
    }
  }

  // errors
  let errorMsg: string = '';
  const duplicateErrors = Array.from(entities.entries())
    .filter(([_, info]) => info.occurrences.length > 1)
    .map(([content, info]) => 
      `- "${content}"\n` +
      info.occurrences.map(({ fname, line }) => 
        fname
          ? `  - File "${fname}" Line ${line}\n`
          : `  - Line ${line}\n`
      ).join('')
    );
  if (duplicateErrors.length > 0) {
    errorMsg += 'semtree.lint(): duplicate entity names found:\n\n' + duplicateErrors.join('');
  }
  if (badIndentations.length > 0) {
    errorMsg += 'semtree.lint(): improper indentation found:\n\n';
    badIndentations.forEach(({ fname, line, content, reason }) => {
      errorMsg += fname
        ? `- File "${fname}" Line ${line} (${reason}): "${content}"\n`
        : `- Line ${line} (${reason}): "${content}"\n`;
    });
  }
  // warnings
  let warnMsg: string = '';
  // Check for unused content keys
  if (typeof content === 'object') {
    if (orphanTrunks.length > 0) {
      warnMsg += 'semtree.lint(): orphan trunk files found:\n\n';
      orphanTrunks.forEach(key => {
        warnMsg += `- ${key}\n`;
      });
    }
  }
  if (markdownWarnings.length > 0) {
    errorMsg += 'semtree.lint(): ' + (mkdnList ? 'missing' : 'unexpected') + ' markdown bullet found:\n\n';
    markdownWarnings.forEach(({ fname, line, content }) => {
      errorMsg += fname
        ? `- File "${fname}" Line ${line}: "${content}"\n`
        : `- Line ${line}: "${content}"\n`;
    });
  }
  if (wikitextWarnings.length > 0) {
    errorMsg += 'semtree.lint(): ' + (wikitext ? 'missing' : 'unexpected') + ' wikitext found:\n\n';
    wikitextWarnings.forEach(({ fname, line, content }) => {
      errorMsg += fname
        ? `- File "${fname}" Line ${line}: "${content}"\n`
        : `- Line ${line}: "${content}"\n`;
    });
  }
  if ((warnMsg.length > 0) || (errorMsg.length > 0)) {
    return {
      warn: warnMsg,
      error: errorMsg,
    };
  }
  return undefined;
};