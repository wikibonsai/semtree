// main api
export { create } from './lib/create';
export { update } from './lib/update';
// helper funcs
export { lint } from './lib/lint';
export { print } from './lib/print';
// util funcs
export { checkComment, getLevel, rawText } from './lib/text';
// types
export type {
  LintOpts,
  SemTree,
  SemTreeOpts,
  TreeNode,
} from './lib/types';
