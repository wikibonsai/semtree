import type { SemTreeOpts, SemTree, TreeBuilderState, TreeNode } from './types';
import { validate } from './validate';
import { pruneOrphans } from './orphan';
import { rawText, extractTreeContent } from './text';

export const createInitialState = (
  root: string,
  content: Record<string, string>,
  opts: SemTreeOpts,
  existingTree?: SemTree,
): TreeBuilderState => ({
  state: 'INITIAL',
  content,
  opts: opts,
  root: existingTree ? existingTree.root : root,
  nodes: existingTree ? [...existingTree.nodes] : [],
  branches: existingTree ? [...existingTree.branches] : [],
  petioleMap: existingTree ? { ...existingTree.petioleMap } : {},
  orphanedBranches: existingTree ? [...existingTree.orphanedBranches] : [],
  level: 0,
  currentAncestors: [],
  isUpdate: !!existingTree,
  subroot: opts.subroot,
  updatedNodes: [],
});

export const extractContent = (state: TreeBuilderState): TreeBuilderState => {
  const result: {
    content: Record<string, string>,
    lineOffsets: Record<string, number>,
  } = extractTreeContent(state.content);
  return {
    ...state,
    state: 'EXTRACTING_CONTENT',
    content: result.content,
    lineOffsets: result.lineOffsets,
  };
};

export const processRoot = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'PROCESSING_ROOT',
    root: state.root,
    virtualRoot: state.opts.virtualBranches
      ? (state.isUpdate
        ? state.root!
        : (state.subroot || state.opts.subroot || Object.keys(state.content)[0]))
      : undefined,
    subroot: state.isUpdate
      ? (state.subroot || state.opts.subroot || Object.keys(state.content)[0])
      : undefined,
  };
};

export const validateContent = (state: TreeBuilderState): TreeBuilderState => {
  const validateError: { warn: string, error: string } | void = validate(state.content as Record<string, string>, {
    indentKind: state.opts.indentKind,
    indentSize: state.opts.indentSize,
    mkdnBullet: state.opts.mkdnBullet,
    wikiLink: state.opts.wikiLink,
    root: state.virtualRoot ?? state.root ?? undefined,
    lineOffsets: state.lineOffsets,
  });
  if (validateError?.error) {
    throw new Error(validateError.warn + validateError.error);
  }
  return {
    ...state,
    state: 'VALIDATING_CONTENT',
  };
};

export const storeState = (state: TreeBuilderState): TreeBuilderState => ({
  ...state,
  state: 'STORING_STATE',
  originalState: {
    root: state.root!,
    nodes: state.nodes.map(node => ({ ...node })),
    branches: [...state.branches],
    petioleMap: { ...state.petioleMap },
    orphanedBranches: [...state.orphanedBranches],
  },
});

// process content

export const processBranch = (state: TreeBuilderState, branchText: string): TreeBuilderState => {
  if (state.opts.virtualBranches) { return state; }
  // branch
  let branchNode: TreeNode | undefined = state.nodes.find(node => node.text === branchText);
  // create
  if (!branchNode) {
    branchNode = {
      text: branchText,
      ancestors: [...state.currentAncestors],
      children: [],
    };
    state.nodes.push(branchNode);
  }
  // update
  if (state.isUpdate) {
    if (state.subroot === branchText) {
      state.currentAncestors = [...branchNode.ancestors];
      state.level = branchNode.ancestors.length;
    }
    branchNode.children = [];
    state.updatedNodes.push(branchNode);
  }
  // metadata
  if (state.root === branchText) {
    state.petioleMap[branchText] = state.root;
  }
  if (!state.branches.includes(branchText)) {
    state.branches.push(branchText);
  }
  return {
    ...state,
    state: 'PROCESSING_BRANCH',
    currentAncestors: [...state.currentAncestors, branchText],
  };
};

export const processLeaf = (state: TreeBuilderState, line: string, level: number, branchText: string): TreeBuilderState => {
  // line text
  const trimmedLine: string = line.trim();
  if (!trimmedLine) return state;
  const leafText: string = rawText(trimmedLine, {
    hasBullets: state.opts.mkdnBullet,
    hasWiki: state.opts.wikiLink,
  });
  // ancestors
  state.currentAncestors = state.currentAncestors.slice(0, level + state.level);
  // parent
  const parent: string | undefined = state.currentAncestors[state.currentAncestors.length - 1];
  const parentNode: TreeNode | undefined = state.nodes.find(node => node.text === parent);
  if (parentNode) {
    if (!parentNode.children.includes(leafText)) {
      // calculate insertion index
      const contentArray: string[] = (state.content[branchText] as string).split('\n');
      const currentIndex: number = contentArray.findIndex(l => rawText(l.trim(), {
        hasBullets: state.opts.mkdnBullet,
        hasWiki: state.opts.wikiLink,
      }) === leafText);
      const insertIndex: number = parentNode.children.findIndex(child => {
        const childIndex: number = contentArray.findIndex(l => rawText(l.trim(), {
          hasBullets: state.opts.mkdnBullet,
          hasWiki: state.opts.wikiLink,
        }) === child);
        return childIndex > currentIndex;
      });
      // add
      if (insertIndex === -1) {
        parentNode.children.push(leafText);
      } else {
        parentNode.children.splice(insertIndex, 0, leafText);
      }
    }
  }
  // leaf
  let leafNode: TreeNode | undefined = state.nodes.find(node => node.text === leafText);
  // create
  if (!leafNode) {
    leafNode = {
      text: leafText,
      ancestors: [...state.currentAncestors],
      children: [],
    };
    state.nodes.push(leafNode);
  }
  // update
  if (state.isUpdate) {
    leafNode.ancestors = [...state.currentAncestors];
    leafNode.children = [];
    state.updatedNodes.push(leafNode);
  }
  // metadata
  if (!state.opts.virtualBranches) {
    state.petioleMap[leafText] = branchText;
  }
  // return
  return {
    ...state,
    state: 'PROCESSING_LEAF',
    currentAncestors: [...state.currentAncestors, leafText],
  };
};

export const pruneOrphanNodes = (state: TreeBuilderState): TreeBuilderState => {
  const pruned: SemTree | string = pruneOrphans({
    root: state.root!,
    branches: state.branches,
    petioleMap: state.petioleMap,
    nodes: state.nodes,
    orphanedBranches: state.orphanedBranches,
  });
  if (typeof pruned === 'string') {
    throw new Error(pruned);
  }
  return {
    ...state,
    state: 'PRUNING_ORPHANS',
    nodes: pruned.nodes,
    branches: pruned.branches,
    petioleMap: pruned.petioleMap,
  };
};

export const finalize = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'FINALIZING',
    root: state.opts.virtualBranches ? state.virtualRoot! : state.root!,
    branches: state.opts.virtualBranches ? [] : state.branches,
    petioleMap: state.opts.virtualBranches ? {} : state.petioleMap,
    orphanedBranches: state.opts.virtualBranches ? [] : [...Object.keys(state.content)],
  };
};

export const restoreState = (state: TreeBuilderState): TreeBuilderState => ({
  ...state,
  state: 'RESTORING_STATE',
  root: state.originalState?.root || state.root!,
  nodes: state.originalState?.nodes || [],
  branches: state.originalState?.branches || [],
  petioleMap: state.originalState?.petioleMap || {},
  orphanedBranches: state.originalState?.orphanedBranches || [],
});
