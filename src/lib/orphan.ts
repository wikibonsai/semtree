import { SemTree, TreeNode } from './types';


export const pruneOrphans = (tree: SemTree): SemTree | string => {
  const connectedNodes: Set<string> = new Set<string>();
  const traverseTree = (nodeText: string) => {
    if (connectedNodes.has(nodeText)) { return; }
    connectedNodes.add(nodeText);
    const node: TreeNode | undefined = tree.nodes.find(n => n.text === nodeText);
    if (node) {
      node.children.forEach(traverseTree);
    }
  };
  // go
  const root: TreeNode | undefined = tree.nodes.find((n: TreeNode) => tree.root === n.text);
  if (root == undefined) { return 'semtree.pruneDangling: could not find root node'; }
  traverseTree(root.text);
  const orphans = tree.nodes.filter((n: TreeNode) => !connectedNodes.has(n.text)).map((n: TreeNode) => n.text);
  if (orphans.length > 0) {
    for (const orphan of orphans) {
      const curNodeIndex: number | undefined = tree.nodes.findIndex((n: TreeNode) => n.text === orphan);
      if (curNodeIndex < 0) { continue; }
      tree.nodes.splice(curNodeIndex, 1);
    }
  }
  return tree;
};
