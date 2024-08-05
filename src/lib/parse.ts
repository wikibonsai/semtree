import type { SemTreeOpts, TreeNode } from './types';

import { getChunkSize, rawText } from './func';
import { lint } from './lint';
import { buildTree } from './build-tree';


// // single file
// function parse(content: string, root?: string): any;
// // multiple files
// function parse(content: Record<string, string>, root: string): any;
// define
export const parse = (
  content: string | Record<string, string>,
  root?: string,
  opts?: SemTreeOpts,
): TreeNode[] | string => {
  // opts
  // syntax
  let chunkSize: number     = opts?.chunkSize || -1;
  const virtualTrunk: boolean = opts?.virtualTrunk || false;
  const mkdnList: boolean     = opts?.mkdnList || true;
  const wikitext: boolean     = opts?.wikitext || true;
  let contentHash: Record<string, string[]> = {};
  // single file
  if (typeof content === 'string') {
    const lines: string[] = content.split('\n').filter(line => line.trim().length > 0);
    if (chunkSize === -1) {
      chunkSize = getChunkSize(lines);
    }
    const zeroIndentLines: string[] = lines.filter(line => !line.match(/^\s/));
    // single root does not exist
    if (zeroIndentLines.length > 1) {
      return 'semtree.parse(): multiple lines with zero indentation found. A tree with multiple roots cannot be made. Please add a filename as a "root" parameter or fix the indentation.';
    // single root does exist
    } else if (zeroIndentLines.length === 1) {
      root = rawText(zeroIndentLines[0], mkdnList);
      // rm root line and adjust indentation for remaining lines
      if (!virtualTrunk) {
        const remainingLines: string[] = lines.slice(1).filter(line => line.trim().length > 0);
        contentHash[root] = remainingLines.map((line: string) =>  line.slice(chunkSize));
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
    chunkSize = getChunkSize(contentHash[root]);
  }
  const lintError: string | void = lint(content);
  if (lintError) {
    return lintError;
  }
  const tree: TreeNode[] | string = buildTree(root, contentHash, { ...opts, chunkSize });
  return tree;
};
