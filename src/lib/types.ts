export interface SemTree {
  nodes: TreeNode[];
  trunk: string[];
  petioleMap: Record<string, string>;
  root: string;
}

export interface SemTreeOpts {
  // params
  virtualTrunk?: boolean;                              // whether or not to include the semtree/index files themselves as nodes in the tree
  lvlSize?: number;                                    // the number of indentations per tree level
  subroot?: string;                                    // the root of the subtree to be updated
  mkdnList?: boolean;                                  // whether or not to expect markdown bullets ('- ', '* ', '+ ') for each node
  wikitext?: boolean;                                  // whether or not to expect [[wikilink square brackets]] so they may be ignored when processing tree text
  // functions
  graft?: (text: string, ancestors: string[]) => void; // a function to execute when each node is added to the tree
  prune?: (text: string, ancestors: string[]) => void; // a function to execute when each node is removed from the tree
  setRoot?: (name: string) => void;                    // a function that can return/handle the root name of the tree
}

export interface BuildTreeOpts extends SemTreeOpts {
  tree?: SemTree;                                      // the tree to be updated (if not provided, a new tree will be built)
  ancestors?: TreeNode[]                               // the ancestors of the node to be updated
  level?: number;                                      // the level of the tree to be updated
}

export interface TreeNode {
  text: string;
  ancestors: string[];
  children: string[];
  // optional data -- for flexibly adding new node properties
  [key: string]: any;
  // for building
  line?: number;
  level?: number;
}