import { SemTree, SemTreeOpts } from './types';
import { defaultOpts } from './const';
import { build } from './build';


export const create = (
  root: string,
  content: Record<string, string>,
  options?: SemTreeOpts,
): SemTree | string => {
  const contentArray: Record<string, string[]> = Object.fromEntries(
    Object.entries(content).map(([key, value]) => [key, value.split('\n').filter(line => line.trim().length > 0)])
  );

  const result = build(root, contentArray, { ...defaultOpts, ...options });

  if (typeof result === 'string') {
    return result;
  }

  // option function operations
  if (options?.setRoot) {
    options.setRoot(result.root);
  }
  if (options?.graft) {
    for (const node of result.nodes) {
      if (node.ancestors.length > 0) {
        const parentText = node.ancestors[node.ancestors.length - 1];
        options.graft(parentText, node.text);
      }
    }
  }

  return result;
};
