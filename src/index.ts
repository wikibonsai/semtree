// main api
export { create } from './lib/create';
export { update } from './lib/update';
// helper funcs
export { validate } from './lib/validate';
export { validate as lint } from './lib/validate'; // backward-compat alias
export { print } from './lib/print';
// util funcs
export {
  checkComment,
  extractTreeContent,
  getLevel,
  rawText,
} from './lib/text';
// types
export type {
  ValidateOpts,
  ValidateOpts as LintOpts, // backward-compat alias
  SemTree,
  SemTreeOpts,
  TreeNode,
} from './lib/types';
