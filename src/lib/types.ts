export interface SemTreeOpts {
  // params
  // tree
  delimiter?: string;                                  // the keyword to use for semtree section markers
  virtualTrunk?: boolean;                              // whether or not to include the semtree/index files themselves as nodes in the tree
  // text / lint
  indentKind?: 'space' | 'tab';                        // the type of indentation (space or tab)
  indentSize?: number;                                 // the number of indentations per tree level
  subroot?: string;                                    // the root of the subtree to be updated
  mkdnBullet?: boolean;                                // whether or not to expect markdown bullets ('- ', '* ', '+ ') in node text
  wikiLink?: boolean;                                  // whether or not to expect wikilinks ([[square brackets]]) in node text
  // functions
  graft?: (parentText: string, childText: string) => void; // a function to execute when each node is added to the tree
  prune?: (parentText: string, childText: string) => void; // a function to execute when each node is removed from the tree
  setRoot?: (name: string) => void;                    // a function that can return/handle the root name of the tree
}

export interface BuildTreeOpts extends SemTreeOpts {
  tree?: SemTree;                                      // the tree to be updated (if not provided, a new tree will be built)
  ancestors?: TreeNode[]                               // the ancestors of the node to be updated
  level?: number;                                      // the level of the tree to be updated
}

export type TreeBuildingState = 'EXTRACTING_CONTENT'
                              | 'FINALIZING'
                              | 'INITIAL'
                              | 'LINTING_CONTENT'
                              | 'PROCESSING_BRANCH'
                              | 'PROCESSING_LEAF'
                              | 'PROCESSING_ROOT'
                              | 'PRUNING_ORPHANS'
                              | 'RESTORING_STATE'
                              | 'STORING_STATE';

export type TreeBuilderState = {
  state: TreeBuildingState;
  // input
  content: Record<string, string>;
  opts: SemTreeOpts;
  // tree
  root: string | null;
  nodes: TreeNode[];
  trunk: string[];
  orphans: string[];
  petioleMap: Record<string, string>;
  // tree processing
  level: number;
  currentAncestors: string[];
  virtualRoot?: string; // for virtual trunk mode
  // subtree
  originalState?: SemTree;
  isUpdate: boolean;
  subroot?: string;
  updatedNodes: TreeNode[];
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
  mkdnBullet?: boolean;                                // whether or not to expect markdown bullets ('- ', '* ', '+ ') for each node
  wikiLink?: boolean;                                  // whether or not to expect [[wikilink square brackets]] so they may be ignored when processing tree text
  // tree
  root?: string;                                       // for linting duplicates (cycles) and unused turnk files
}
