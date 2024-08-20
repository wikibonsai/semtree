import type { LintOpts } from './types';
import {
  defaultOpts,
  RGX_INDENT_SPACE,
  RGX_INDENT_TAB,
  RGX_MKDN_BLT,
  RGX_WIKI,
} from './const';


export const lint = (
  content: string | Record<string, string>,
  options: LintOpts,
): void | { warn: string, error: string } => {
  /* @ts-expect-error: options.indentSize is optional */
  const indentKind: 'space' | 'tab' = options.indentKind ?? defaultOpts.indentKind;
  /* @ts-expect-error: options.indentSize is optional */
  const indentSize: number = options.indentSize ?? defaultOpts.indentSize;
  /* @ts-expect-error: options.mkdnList is optional */
  const mkdnList: boolean = options.mkdnList ?? defaultOpts.mkdnList;
  /* @ts-expect-error: options.wikitext is optional */
  const wikitext: boolean = options.wikitext ?? defaultOpts.wikitext;
  // warnings
  const badIndentations: { fname?: string, line: number; content: string; reason: string }[] = [];
  // Update the entities type
  const entities: Map<string, { occurrences: { fname?: string, line: number }[] }> = new Map();
  const lintOrphanTrunks: string[] = [];
  const lintDuplicates: { fname?: string, line: number; content: string }[] = [];
  const lintMkdnBullets: { fname?: string, line: number; content: string }[] = [];
  const lintWikitext: { fname?: string, line: number; content: string }[] = [];
  // state
  let previousIndent: number = 0;
  // linting per line
  const lintLine = (line: string, lineNumber: number, fname?: string) => {
    if (line.length > 0) {
      // indentation check
      const RGX_INDENT: RegExp = (indentKind === 'space') ? RGX_INDENT_SPACE : RGX_INDENT_TAB;
      const RGX_WRONG_INDENT: RegExp = (indentKind === 'space') ? RGX_INDENT_TAB : RGX_INDENT_SPACE;
      const match: RegExpMatchArray | null = line.match(RGX_INDENT);
      const currentIndent: number = match ? match[0].length : 0;
      const isFirstCharWhitespace: boolean = /\s/.test(line[0]);
      // improper indentation
      if (isFirstCharWhitespace && RGX_WRONG_INDENT.test(line)) {
        badIndentations.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
          reason: (indentKind === 'space') ? 'tabs found' : 'spaces found',
        });
      } else if (currentIndent % indentSize !== 0) {
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
      const hasBullet: boolean = RGX_MKDN_BLT.test(trimmedLine);
      if ((currentIndent > 0) && (hasBullet !== mkdnList)) {
        lintMkdnBullets.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
        });
      }
      // wikitext check
      const hasWikitext: boolean = RGX_WIKI.test(trimmedLine);
      if ((currentIndent > 0) && (hasWikitext !== wikitext)) {
        lintWikitext.push({
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
        lintDuplicates.push({
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
          lintOrphanTrunks.push(key);
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
    if (lintOrphanTrunks.length > 0) {
      warnMsg += 'semtree.lint(): orphan trunk files found:\n\n';
      lintOrphanTrunks.forEach(key => {
        warnMsg += `- ${key}\n`;
      });
    }
  }
  if (lintMkdnBullets.length > 0) {
    warnMsg += 'semtree.lint(): ' + (mkdnList ? 'missing' : 'unexpected') + ' markdown bullet found:\n\n';
    lintMkdnBullets.forEach(({ fname, line, content }) => {
      warnMsg += fname
        ? `- File "${fname}" Line ${line}: "${content}"\n`
        : `- Line ${line}: "${content}"\n`;
    });
  }
  if (lintWikitext.length > 0) {
    warnMsg += 'semtree.lint(): ' + (wikitext ? 'missing' : 'unexpected') + ' wikitext found:\n\n';
    lintWikitext.forEach(({ fname, line, content }) => {
      warnMsg += fname
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