import { SemTree, SemTreeOpts } from './types';
import { defaultOpts } from './const';
import { build } from './build';


export const create = (
  root: string,
  content: Record<string, string>,
  opts?: SemTreeOpts,
): SemTree | string => {
  const result = build(root, content, { ...defaultOpts, ...opts });

  if (typeof result === 'string') {
    return result;
  }

  // option function operations
  if (opts?.setRoot) {
    opts.setRoot(result.root);
  }
  if (opts?.graft) {
    for (const node of result.nodes) {
      if (node.ancestors.length > 0) {
        const parentText = node.ancestors[node.ancestors.length - 1];
        opts.graft(parentText, node.text);
      }
    }
  }

  return result;
};
