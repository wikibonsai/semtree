export interface SemTreeOpts {
  // params
  virtualTrunk?: boolean;                              // whether or not to include the semtree/index files themselves as nodes in the tree
  indentKind?: 'space' | 'tab';                        // the type of indentation (space or tab)
  indentSize?: number;                                 // the number of indentations per tree level
  subroot?: string;                                    // the root of the subtree to be updated
  mkdnList?: boolean;                                  // whether or not to expect markdown bullets ('- ', '* ', '+ ') for each node
  wikitext?: boolean;                                  // whether or not to expect [[wikilink square brackets]] so they may be ignored when processing tree text
  // functions
  graft?: (parentID: string, childID: string) => void; // a function to execute when each node is added to the tree
  prune?: (parentID: string, childID: string) => void; // a function to execute when each node is removed from the tree
  setRoot?: (name: string) => void;                    // a function that can return/handle the root name of the tree
}

export interface BuildTreeOpts extends SemTreeOpts {
  tree?: SemTree;                                      // the tree to be updated (if not provided, a new tree will be built)
  ancestors?: TreeNode[]                               // the ancestors of the node to be updated
  level?: number;                                      // the level of the tree to be updated
}

export type TreeBuildingState = 'INITIAL'
                              | 'PROCESSING_ROOT'
                              | 'PROCESSING_BRANCH'
                              | 'PROCESSING_LEAF'
                              | 'FINALIZING';

export type TreeBuilderState = {
  state: TreeBuildingState;
  // input
  content: Record<string, string[]>;
  options: SemTreeOpts;
  // tree
  root: string | null;
  nodes: TreeNode[];
  trunk: string[];
  orphans: string[];
  petioleMap: Record<string, string>;
  // tree processing
  level: number;
  currentAncestors: string[];
  // subtree
  originalState?: { nodes: TreeNode[], trunk: string[], petioleMap: Record<string, string> };
  isUpdate: boolean;
  subroot?: string;
  updatedNodes: TreeNode[];
  // virtual trunk
  virtualRoot?: string;
};

export interface TreeNode {
  text: string;
  ancestors: string[];
  children: string[];
  // optional data -- for flexibly adding new node properties
  [key: string]: any;
}

export interface SemTree {
  root: string;
  nodes: TreeNode[];
  trunk: string[];
  orphans: string[];
  petioleMap: Record<string, string>;
}

// lint

export interface LintOpts {
  // syntax
  indentKind?: 'space' | 'tab';                        // the type of indentation (space or tab)
  indentSize?: number;                                 // the number of indentations per tree level
  mkdnList?: boolean;                                  // whether or not to expect markdown bullets ('- ', '* ', '+ ') for each node
  wikitext?: boolean;                                  // whether or not to expect [[wikilink square brackets]] so they may be ignored when processing tree text
  // tree
  root?: string;                                       // the root of the subtree to be updated
}
