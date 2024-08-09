import type { SemTree, SemTreeOpts } from './types';

import { defaultOpts } from './const';
import { getLevelSize } from './func';
import { lint } from './lint';
import { build } from './build';


export const create = (
  root: string,
  content: Record<string, string>,
  opts: SemTreeOpts = defaultOpts,
): SemTree | string => {
  // validation
  if (!root) {
    return 'semtree.create(): cannot parse "content" without a "root" defined';
  }
  if (!Object.keys(content).includes(root)) {
    return `semtree.create(): content hash does not contain: '${root}'; keys are: ${Object.keys(content)}`;
  }
  // opts
  opts = { ...defaultOpts, ...opts };
  // tree
  const virtualTrunk: boolean = opts.virtualTrunk ?? false;
  // syntax
  const mkdnList: boolean     = opts.mkdnList     ?? true;
  const wikitext: boolean     = opts.wikitext     ?? true;
  let lvlSize: number         = opts.lvlSize      ?? -1;
  // go
  /* eslint-disable indent */
  const contentHash: Record<string, string[]> = Object.fromEntries(
                                                Object.entries(content)
                                                      .map(([key, value]) => [key, value.split('\n')
                                                                                        .filter((line) => line.length > 0)])
                                              );
  /* eslint-enable indent */
  lvlSize = getLevelSize(contentHash[root]);
  // if lvlSize is still -1, try to find it in the other files
  if (lvlSize == -1) {
    for (const key of Object.keys(contentHash)) {
      lvlSize = getLevelSize(contentHash[key]);
      if (lvlSize > 0) { break; }
    }
    if (lvlSize < 0) {
      return 'semtree.create(): indentation could not be determined -- is it possible no root exists?';
    }
  }
  // lint
  const lintError: string | void = lint(content, lvlSize);
  if (lintError) {
    return lintError;
  }
  // go
  const tree: SemTree | string = build(root, contentHash, { ...opts, lvlSize: lvlSize });
  return tree;
};