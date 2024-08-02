import { TreeNode } from './types';


// note: this doubles as cycle detection
export const checkDuplicates = (nodes: TreeNode[]): undefined | string => {
  const duplicates: string[] = [];
  const seenTexts: Set<string> = new Set<string>();
  for (const node of nodes) {
    if (seenTexts.has(node.text)) {
      duplicates.push(node.text);
    } else {
      seenTexts.add(node.text);
    }
  }
  const hasDup: boolean = duplicates.length > 0;
  if (hasDup) {
    // delete duplicate duplicates, convert to array
    const dupNames: string[] = Array.from(new Set(duplicates));
    let errorMsg: string = 'semtree.checkDuplicates(): tree did not build, duplicate nodes found:\n\n';
    errorMsg += dupNames.join(', ') + '\n\n';
    return errorMsg;
  }
};
