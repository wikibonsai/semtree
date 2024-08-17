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
  // validate subroot
  const subrootNode = tree.nodes.find(node => node.text === subroot);
  if (!subrootNode) {
    return `semtree.update(): subroot not found in the tree: "${subroot}"`;
  }
  // track updated trunk nodes
  const updatedTrunkNodes: string[] = Object.keys(contentArray);
  // grab all original connections
  const originalConnections = new Set(
    tree.nodes.flatMap(node => node.children.map(child => `${node.text}:${child}`))
  );
  // go
  const updatedTree = build(subroot, contentArray, {
    ...defaultOpts,
    ...options,
    subroot: subroot,
  }, tree);
  if (typeof updatedTree === 'string') {
    return updatedTree;
  }
  // grab updated connections
  const updatedConnections = new Set(
    updatedTree.nodes.flatMap(node => node.children.map(child => `${node.text}:${child}`))
  );
  if (options.graft) {
    for (const connection of updatedConnections) {
      if (!originalConnections.has(connection)) {
        const [parent, child] = connection.split(':');
        options.graft(parent, child);
      }
    }
  }

  if (options.prune) {
    for (const connection of originalConnections) {
      if (!updatedConnections.has(connection)) {
        const [parent, child] = connection.split(':');
        options.prune(parent, child);
      }
    }
  }

  // Update tree
  tree.nodes = updatedTree.nodes;
  tree.petioleMap = updatedTree.petioleMap;
  tree.trunk = updatedTree.trunk;

  // Return updated nodes
  return updatedTree.nodes.filter(n => 
    updatedTrunkNodes.includes(n.text) ||
    updatedTrunkNodes.some(key => tree.petioleMap[n.text] === key)
  );
};