export interface SemTreeOpts {
  graft: (text: string, ancestors: string[]) => void; // a function to execute when each node is added to the tree
  prune: (text: string, ancestors: string[]) => void; // a function to execute when each node is removed from the tree
  mkdnList: boolean;                                  // whether or not to expect markdown bullets ('- ') for each node
  nanoid: {                                           // nanoid options; for more, see: https://github.com/ai/nanoid#custom-alphabet-or-size
    alphabet: string;
    size: number;
  };
  setRoot: (name: string) => void;                    // a function that can return/handle the root name of the tree
  suffix: 'none' | 'id' | 'loc';                      // a unique 'id' (see 'textWithID') or the location 'loc' (see 'textWithLoc') of the item in the file
  testing: boolean;                                   // are we testing?
  virtualTrunk: boolean;                              // whether or not to include the semtree/index files themselves as nodes in the tree
  wikitext: boolean;                                  // whether or not to expect [[wikilink square brackets]] so they may be ignored when processing tree text
}

export interface TreeNode {
  text: string;
  ancestors: string[];
  children: string[];
  // make extendible for flexibly adding other node properties
  [key: string]: any;
  // for building
  line?: number;
  level?: number;
}
