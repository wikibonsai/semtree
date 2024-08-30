import type { SemTreeOpts, SemTree, TreeBuilderState, TreeNode } from './types';
import { lint } from './lint';
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
  trunk: existingTree ? [...existingTree.trunk] : [],
  petioleMap: existingTree ? { ...existingTree.petioleMap } : {},
  orphans: existingTree ? [...existingTree.orphans] : [],
  level: 0,
  currentAncestors: [],
  isUpdate: !!existingTree,
  subroot: opts.subroot,
  updatedNodes: [],
});

export const extractContent = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'EXTRACTING_CONTENT',
    content: extractTreeContent(state.content as Record<string, string>),
  };
};

export const processRoot = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'PROCESSING_ROOT',
    root: state.root,
    virtualRoot: state.opts.virtualTrunk
      ? (state.isUpdate
        ? state.root!
        : (state.subroot || state.opts.subroot || Object.keys(state.content)[0]))
      : undefined,
    subroot: state.isUpdate
      ? (state.subroot || state.opts.subroot || Object.keys(state.content)[0])
      : undefined,
  };
};

export const lintContent = (state: TreeBuilderState): TreeBuilderState => {
  const lintError: { warn: string, error: string } | void = lint(state.content as Record<string, string>, {
    indentKind: state.opts.indentKind,
    indentSize: state.opts.indentSize,
    mkdnBullet: state.opts.mkdnBullet,
    wikiLink: state.opts.wikiLink,
    root: state.virtualRoot ?? state.root ?? undefined,
  });
  if (lintError?.error) {
    throw new Error(lintError.warn + lintError.error);
  }
  return {
    ...state,
    state: 'LINTING_CONTENT',
  };
};

export const storeState = (state: TreeBuilderState): TreeBuilderState => ({
  ...state,
  state: 'STORING_STATE',
  originalState: {
    root: state.root!,
    nodes: state.nodes.map(node => ({ ...node })),
    trunk: [...state.trunk],
    petioleMap: { ...state.petioleMap },
    orphans: [...state.orphans],
  },
});

// process content

export const processBranch = (state: TreeBuilderState, branchText: string): TreeBuilderState => {
  if (state.opts.virtualTrunk) { return state; }
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
  if (!state.trunk.includes(branchText)) {
    state.trunk.push(branchText);
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
  if (!state.opts.virtualTrunk) {
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
    trunk: state.trunk,
    petioleMap: state.petioleMap,
    nodes: state.nodes,
    orphans: state.orphans,
  });
  if (typeof pruned === 'string') {
    throw new Error(pruned);
  }
  return {
    ...state,
    state: 'PRUNING_ORPHANS',
    nodes: pruned.nodes,
    trunk: pruned.trunk,
    petioleMap: pruned.petioleMap,
  };
};

export const finalize = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'FINALIZING',
    root: state.opts.virtualTrunk ? state.virtualRoot! : state.root!,
    trunk: state.opts.virtualTrunk ? [] : state.trunk,
    petioleMap: state.opts.virtualTrunk ? {} : state.petioleMap,
    orphans: state.opts.virtualTrunk ? [] : [...Object.keys(state.content)],
  };
};

export const restoreState = (state: TreeBuilderState): TreeBuilderState => ({
  ...state,
  state: 'RESTORING_STATE',
  root: state.originalState?.root || state.root!,
  nodes: state.originalState?.nodes || [],
  trunk: state.originalState?.trunk || [],
  petioleMap: state.originalState?.petioleMap || {},
  orphans: state.originalState?.orphans || [],
});
