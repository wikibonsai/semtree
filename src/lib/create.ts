import { SemTree, SemTreeOpts } from './types';
import { defaultOpts } from './const';
import { build } from './build';


export const create = (
  root: string,
  content: Record<string, string>,
  options: SemTreeOpts,
): SemTree | string => {
  const contentArray: Record<string, string[]> = Object.fromEntries(
    Object.entries(content).map(([key, value]) => [key, value.split('\n').filter(line => line.trim().length > 0)])
  );

  return build(root, contentArray, { ...defaultOpts, ...options });
};
