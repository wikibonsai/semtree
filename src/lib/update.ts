import { SemTree, TreeNode, SemTreeOpts } from './types';
import { defaultOpts } from './const';
import { build } from './build';


export const update = (
  tree: SemTree,
  subroot: string,
  content: Record<string, string>,
  opts?: SemTreeOpts,
): TreeNode[] | string => {
  if (opts?.virtualBranches) {
    return 'semtree.update(): cannot run updates on virtual branches';
  }
  // validate subroot
  const subrootNode: TreeNode | undefined = tree.nodes.find(node => node.text === subroot);
  if (!subrootNode) {
    return `semtree.update(): subroot not found in the tree: "${subroot}"`;
  }
  // track updated branch nodes
  const updatedBranchNodes: string[] = Object.keys(content);
  // grab all original connections
  const originalConnections: Set<string> = new Set(
    tree.nodes.flatMap(node => node.children.map(child => `${node.text}:${child}`))
  );
  // go
  const updatedTree: SemTree | string = build(subroot, content, {
    ...defaultOpts,
    ...opts,
    subroot: subroot,
  }, tree);
  if (typeof updatedTree === 'string') {
    return updatedTree;
  }
  // grab updated connections
  const updatedConnections: Set<string> = new Set(
    updatedTree.nodes.flatMap(node => node.children.map(child => `${node.text}:${child}`))
  );
  // Create a set of all nodes in the updated tree
  const updatedNodeSet: Set<string> = new Set(updatedTree.nodes.map(node => node.text));

  // Remove nodes that are no longer in the tree
  tree.nodes = tree.nodes.filter(node => updatedNodeSet.has(node.text));

  // Update existing nodes and add new ones
  updatedTree.nodes.forEach(updatedNode => {
    const existingNode: TreeNode | undefined = tree.nodes.find(node => node.text === updatedNode.text);
    if (existingNode) {
      existingNode.ancestors = updatedNode.ancestors;
      existingNode.children = updatedNode.children;
    } else {
      tree.nodes.push(updatedNode);
    }
  });

  // Update tree properties
  tree.branches = updatedTree.branches;
  tree.petioleMap = updatedTree.petioleMap;
  tree.orphanedBranches = updatedTree.orphanedBranches;

  // option function operations
  if (opts?.setRoot) {
    opts.setRoot(updatedTree.root);
  }
  if (opts?.graft) {
    for (const connection of updatedConnections) {
      if (!originalConnections.has(connection)) {
        const [parent, child]: string[] = connection.split(':');
        opts.graft(parent, child);
      }
    }
  }
  if (opts?.prune) {
    for (const connection of originalConnections) {
      if (!updatedConnections.has(connection)) {
        const [parent, child]: string[] = connection.split(':');
        opts.prune(parent, child);
      }
    }
  }

  // Return updated nodes
  return tree.nodes.filter(n => 
    updatedBranchNodes.includes(n.text) ||
    updatedBranchNodes.some(key => tree.petioleMap[n.text] === key)
  );
};