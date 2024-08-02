import { TreeNode } from './types';


export const pruneDangling = (nodes: TreeNode[]): TreeNode[] | string => {
  const connectedNodes: Set<string> = new Set<string>();
  const traverseTree = (nodeText: string) => {
    if (connectedNodes.has(nodeText)) { return; }
    connectedNodes.add(nodeText);
    const node: TreeNode | undefined = nodes.find(n => n.text === nodeText);
    if (node) {
      node.children.forEach(traverseTree);
    }
  };
  // go
  const root: TreeNode | undefined = nodes.find((n: TreeNode) => n.isRoot);
  if (root == undefined) { return 'semtree.stripDangling: could not find root node'; }
  traverseTree(root.text);
  const dangling = nodes.filter((n: TreeNode) => !connectedNodes.has(n.text)).map((n: TreeNode) => n.text);
  if (dangling.length > 0) {
    for (const dangle of dangling) {
      const curNodeIndex: number | undefined = nodes.findIndex((n: TreeNode) => n.text === dangle);
      if (curNodeIndex < 0) { continue; }
      nodes.splice(curNodeIndex, 1);
    }
  }
  return nodes;
};
