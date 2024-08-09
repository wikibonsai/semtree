import type { SemTree, SemTreeOpts, TreeNode } from './types';

import { defaultOpts } from './const';
import { getLevelSize, rawText } from './func';
import { lint } from './lint';
import { buildTree } from './build-tree';


// // single file
// function parse(content: string, root?: string): any;
// // multiple files
// function parse(content: Record<string, string>, root: string): any;
// define
export const create = (
  content: string | Record<string, string>,
  root?: string,
  opts: SemTreeOpts = defaultOpts,
): SemTree | string => {
  // opts
  opts = { ...defaultOpts, ...opts };
  // tree
  const virtualTrunk: boolean = opts.virtualTrunk ?? false;
  // syntax
  const mkdnList: boolean     = opts.mkdnList     ?? true;
  const wikitext: boolean     = opts.wikitext     ?? true;
  let lvlSize: number         = opts.lvlSize      ?? -1;
  // go
  let contentHash: Record<string, string[]> = {};
  // single file
  if (typeof content === 'string') {
    const lines: string[] = content.split('\n').filter(line => line.trim().length > 0);
    if (lvlSize === -1) {
      lvlSize = getLevelSize(lines);
    }
    const zeroIndentLines: string[] = lines.filter(line => !line.match(/^\s/));
    // single root does not exist
    if (zeroIndentLines.length > 1) {
      return 'semtree.parse(): multiple lines with zero indentation found. A tree with multiple roots cannot be made. Please add a filename as a "root" parameter or fix the indentation.';
    // single root does exist
    } else if (zeroIndentLines.length === 1) {
      if (typeof root !== 'string') {
        root = rawText(zeroIndentLines[0], { hasBullets: mkdnList, hasWiki: wikitext });
      }
      // rm root line and adjust indentation for remaining lines
      if (!virtualTrunk && (root === undefined)) {
        const remainingLines: string[] = lines.slice(1).filter(line => line.trim().length > 0);
        contentHash[root] = remainingLines.map((line: string) =>  line.slice(lvlSize));
      } else {
        contentHash[root] = lines;
      }
    } else {
      if (!root) {
        return 'semtree.parse(): no root specified and no line with zero indentation found. please provide a root or fix the indentation.';
      }
      contentHash[root] = lines;
    }
  // multi file
  } else {
    if (!root) {
      return 'semtree.parse(): cannot parse multiple files without a "root" defined';
    }
    if (!Object.keys(content).includes(root)) {
      return `semtree.parse(): content hash does not contain: '${root}'; keys are: ${Object.keys(content)}`;
    }
    contentHash = Object.fromEntries(
      Object.entries(content).map(([key, value]) => [key, value.split('\n')])
    );
    lvlSize = getLevelSize(contentHash[root]);
    // if lvlSize is still -1, try to find it in the other files
    if (lvlSize == -1) {
      for (const key of Object.keys(contentHash)) {
        lvlSize = getLevelSize(contentHash[key]);
        if (lvlSize > 0) { break; }
      }
      if (lvlSize < 0) {
        return 'semtree.parse(): lvlSize could not be determined -- is it possible no root exists?';
      }
    }
  }
  const lintError: string | void = lint(content, lvlSize);
  if (lintError) {
    return lintError;
  }
  const tree: SemTree | string = buildTree(root, contentHash, { ...opts, lvlSize: lvlSize });
  return tree;
};
