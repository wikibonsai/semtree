import type { LintOpts } from './types';
import {
  defaultOpts,
  RGX_INDENT_SPACE,
  RGX_INDENT_TAB,
  RGX_MKDN_BLT,
  RGX_WIKI,
} from './const';
import { checkComment } from './text';


export const lint = (
  content: string | Record<string, string>,
  opts: LintOpts,
): void | { warn: string, error: string } => {
  /* @ts-expect-error: opts.indentSize is optional */
  const indentKind: 'space' | 'tab' = opts.indentKind ?? defaultOpts.indentKind;
  /* @ts-expect-error: opts.indentSize is optional */
  const indentSize: number = opts.indentSize ?? defaultOpts.indentSize;
  /* @ts-expect-error: opts.mkdnBullet is optional */
  const mkdnBullet: boolean = opts.mkdnBullet ?? defaultOpts.mkdnBullet;
  /* @ts-expect-error: opts.wikiLink is optional */
  const wikiLink: boolean = opts.wikiLink ?? defaultOpts.wikiLink;
  // warnings
  const badIndentations: { fname?: string, line: number; content: string; reason: string }[] = [];
  // Update the entities type
  const entities: Map<string, { occurrences: { fname?: string, line: number }[] }> = new Map();
  if (opts.root) {
    entities.set(opts.root, { occurrences: [{ fname: opts.root, line: -1 }] });
  }
  const lintOrphanTrunks: string[] = [];
  const lintMkdnBullets: { fname?: string, line: number; content: string }[] = [];
  const lintWikiLink: { fname?: string, line: number; content: string }[] = [];
  // state
  let previousIndent: number = 0;
  // linting per line
  const lintLine = (line: string, lineNumber: number, fname?: string) => {
    if (checkComment(line)) { return; }
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
      if (hasBullet !== mkdnBullet) {
        lintMkdnBullets.push({
          fname: fname ? fname : '',
          line: lineNumber,
          content: line,
        });
      }
      // wikiLink check
      const hasWikiLink: boolean = RGX_WIKI.test(trimmedLine);
      if (hasWikiLink !== wikiLink) {
        lintWikiLink.push({
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
    if (opts.root) {
      // track trunk/index usage
      const contentKeys: string[] = Object.keys(content);
      // remove root from contentKeys
      const rootIndex: number = contentKeys.indexOf(opts.root ?? '');
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
          ? line === -1
            ? `  - Root file "${fname}"\n`
            : `  - File "${fname}" Line ${line}\n`
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
    warnMsg += 'semtree.lint(): ' + (mkdnBullet ? 'missing' : 'unexpected') + ' markdown bullet found:\n\n';
    lintMkdnBullets.forEach(({ fname, line, content }) => {
      warnMsg += fname
        ? `- File "${fname}" Line ${line}: "${content}"\n`
        : `- Line ${line}: "${content}"\n`;
    });
  }
  if (lintWikiLink.length > 0) {
    warnMsg += 'semtree.lint(): ' + (wikiLink ? 'missing' : 'unexpected') + ' wikilink found:\n\n';
    lintWikiLink.forEach(({ fname, line, content }) => {
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