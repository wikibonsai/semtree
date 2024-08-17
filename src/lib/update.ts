import { SemTree, TreeNode, SemTreeOpts } from './types';
import { defaultOpts } from './const';
import { build } from './build';

export const update = (
  tree: SemTree,
  subroot: string,
  content: Record<string, string>,
  options: SemTreeOpts,
): TreeNode[] | string => {
  const contentArray: Record<string, string[]> = Object.fromEntries(
    Object.entries(content).map(([key, value]) => [key, value.split('\n').filter(line => line.trim().length > 0)])
  );
  const updatedTrunkNodes: string[] = Object.keys(contentArray);

  const subrootNode = tree.nodes.find(node => node.text === subroot);
  if (!subrootNode) {
    return `semtree.update(): subroot not found in the tree: "${subroot}"`;
  }

  const updatedTree = build(subroot, contentArray, {
    ...defaultOpts,
    ...options,
    subroot: subroot,
  }, tree);

  if (typeof updatedTree === 'string') {
    return updatedTree;
  }

  // Update the full tree
  tree.nodes = updatedTree.nodes;
  tree.petioleMap = updatedTree.petioleMap;
  tree.trunk = updatedTree.trunk;

  // Find the nodes that were actually updated (those in the content file or their descendants)
  const updatedNodes: TreeNode[] = tree.nodes.filter(n => {
    return updatedTrunkNodes.includes(n.text) ||
      updatedTrunkNodes.some(key => tree.petioleMap[n.text] === key);
  });
  return updatedNodes;
};
