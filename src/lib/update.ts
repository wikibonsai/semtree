import { SemTree, SemTreeOpts, TreeNode } from './types';

import { defaultOpts } from './const';
import { lint } from './lint';
import { pruneDangling } from './dangling';
import { checkDuplicates } from './duplicates';
import { build } from './build';
import { getLevelSize } from './func';


// // useful for single page updates (even if page includes links to other index files)
// // e.g. the index file is the 'subroot' and the [[wikirefs]] on the page are 'branchNodes'
// // single file
// export function update(content: string, subroot?: string, opts?: SemTreeOpts): TreeNode[] | string;
// // multiple files
// export function update(content: Record<string, string>, subroot: string, opts?: SemTreeOpts): TreeNode[] | string;
// define
export const update = (
  tree: SemTree,
  content: string | Record<string, string>,
  subroot?: string,
  opts: SemTreeOpts = defaultOpts,
): TreeNode[] | string => {
  // opts
  opts = { ...defaultOpts, ...opts };
  // syntax
  const mkdnList: boolean     = opts.mkdnList     ?? true;
  const wikitext: boolean     = opts.wikitext     ?? true;
  let lvlSize: number         = opts.lvlSize      ?? -1;
  // state management (in case tree is invalid)
  let originalNodes: TreeNode[] = [];
  let originalTrunk: string[] = [];
  let originalPetioleMap: Record<string, string> = {};
  storeState(tree);
  // find and validate subroot node
  const subrootNode: TreeNode | undefined = tree.nodes.find((node) => node.text === subroot);
  if (!subrootNode) {
    return `semtree.update(): subroot not found in the tree: "${subroot}"`;
  }
  // go
  const contentHash: Record<string, string[]> = {};
  if ((typeof content === 'string') && (subroot !== undefined)) {
    contentHash[subroot] = content.split('\n');
    if (lvlSize === -1) {
      lvlSize = getLevelSize(contentHash[subroot]);
    }
  } else {
    if (!subroot) {
      return 'semtree.update(): cannot update multiple files without a "subroot" defined';
    }
    if (!Object.keys(content).includes(subroot)) {
      return `semtree.update(): content hash does not contain root: '${subroot}'`;
    }
    for (const [filename, fileContent] of Object.entries(content)) {
      contentHash[filename] = fileContent.split('\n');
    }
    if (lvlSize === -1) {
      lvlSize = getLevelSize(contentHash[subroot]);
    }
  }
  // prune existing subtree
  const pruneError: void | string = pruneSubTree(subroot);
  if (pruneError) {
    return pruneError;
  }
  // lint
  const lintError: string | void = lint(content, lvlSize);
  if (lintError) {
    restoreState(tree);
    return lintError;
  }
  // rebuild subtree
  const subrootNodeAncestors: TreeNode[] = tree.nodes.filter((node: TreeNode) => subrootNode.ancestors.includes(node.text));
  const updatedTree: SemTree | string = build(
    subroot,
    structuredClone(contentHash),
    {
      ...opts,
      // BuildTreeOpts
      tree: tree,
      subroot: subroot,
      ancestors: subrootNodeAncestors,
      level: subrootNode.ancestors.length,
    },
  );
  if (typeof updatedTree === 'string') {
    restoreState(tree);
    return updatedTree;
  }
  // post-update checks
  const pruned: SemTree | string = pruneDangling(tree);
  if (typeof pruned === 'string') {
    restoreState(tree);
    return pruned;
  } else {
    tree = pruned;
  }
  const hasDups: string | undefined = checkDuplicates(tree.nodes);
  if (typeof hasDups === 'string') {
    restoreState(tree);
    return hasDups;
  }
  refreshAncestors(tree.nodes);
  // return subtree nodes which appeared in `content`
  const updatedNodes: TreeNode[] = tree.nodes.filter(n => {
    return Object.keys(contentHash).includes(n.text) ||
      Object.keys(contentHash).some(key => n.ancestors.includes(key));
  });
  return structuredClone(updatedNodes);

  // helper functions

  // this function is written with single-page index doc updates in mind
  function pruneSubTree(nodeText: string, subroot?: string): void | string {
    if (subroot === undefined) { subroot = nodeText; }
    const node: TreeNode | undefined = tree.nodes.find((n: TreeNode) => n.text === nodeText);
    if (node === undefined) {
      return `semtree.pruneSubTree(): node with text '${nodeText}' not found in subtree`;
    }
    node.children.forEach((childText: string) => pruneSubTree(childText, subroot));
    // handle subroot node (should be last operation)
    if (subroot === nodeText) {
      const subrootNode: TreeNode | undefined = tree.nodes.find((n: TreeNode) => n.text === nodeText);
      if (subrootNode === undefined) {
        return `semtree.pruneSubTree(): subroot node not found for: '${subroot}'`;
      }
      // clear children
      subrootNode.children = [];
    // handle nodes on subroot (in index doc)
    } else if (tree.petioleMap[nodeText] === subroot) {
      const curNodeIndex: number | undefined = tree.nodes.findIndex((n: TreeNode) => n.text === nodeText);
      if (curNodeIndex < 0) {
        return `semtree.pruneSubTree(): node with text '${nodeText}' not found in subtree`;
      }
      // rm node
      tree.nodes.splice(curNodeIndex, 1);
      delete tree.petioleMap[nodeText];
    } else {
      return `semtree.pruneSubTree(): error pruning expected nodeText "${nodeText}"`;
    }
  }

  function refreshAncestors(nodes: TreeNode[]): void {
    const updateAncestors = (node: TreeNode, ancestors: string[]): void => {
      node.ancestors = [...ancestors]; // Create a new array to avoid reference issues
      for (const childText of node.children) {
        const childNode: TreeNode | undefined = nodes.find(n => n.text === childText);
        if (childNode) {
          updateAncestors(childNode, [...ancestors, node.text]);
        }
      }
    };
    const rootNode: TreeNode | undefined = nodes.find(n => n.text === tree.root);
    if (rootNode) {
      updateAncestors(rootNode, []);
    }
  }

  // store state

  function storeState(tree: SemTree): void {
    originalNodes = structuredClone(tree.nodes);
    originalTrunk = [ ...tree.trunk ];
    originalPetioleMap = { ...tree.petioleMap };
  }

  function restoreState(tree: SemTree): void {
    tree.nodes = originalNodes;
    tree.trunk = originalTrunk;
    tree.petioleMap = originalPetioleMap;
  }
};
