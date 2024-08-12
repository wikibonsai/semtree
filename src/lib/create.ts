import type { SemTree, SemTreeOpts } from './types';

import { defaultOpts } from './const';
import { getIndentSize } from './func';
import { lint } from './lint';
import { build } from './build';


export const create = (
  root: string,
  content: Record<string, string>,
  opts: SemTreeOpts = defaultOpts,
): SemTree | string => {
  if (!Object.keys(content).includes(root)) {
    return `semtree.create(): "content" does not contain: '${root}'; keys are: ${Object.keys(content)}`;
  }
  // opts
  opts = { ...defaultOpts, ...opts };
  // go
  /* eslint-disable indent */
  const contentHash: Record<string, string[]> = Object.fromEntries(
                                                Object.entries(content)
                                                      .map(([key, value]) => [key, value.split('\n')
                                                                                        .filter((line) => line.length > 0)])
                                              );
  /* eslint-enable indent */
  const indentSize: number | string = opts.indentSize ?? getIndentSize(root, contentHash);
  if (typeof indentSize === 'string') { return indentSize; }
  // lint
  const lintError: string | void = lint(content, indentSize);
  if (lintError) {
    return lintError;
  }
  // go
  const tree: SemTree | string = build(root, contentHash, { ...opts, indentSize: indentSize });
  return tree;
};