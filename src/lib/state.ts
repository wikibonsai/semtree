import type { SemTreeOpts, SemTree, TreeBuilderState } from './types';
import { RGX_INDENT } from './const';
import { lint } from './lint';
import { pruneDangling } from './dangling';
import { checkDuplicates } from './duplicates';
import { rawText } from './text';


export const createInitialState = (
  root: string,
  content: Record<string, string[]>,
  options: SemTreeOpts,
  existingTree?: SemTree,
): TreeBuilderState => ({
  state: 'INITIAL',
  content,
  options,
  root: existingTree ? existingTree.root : null,
  nodes: existingTree ? [...existingTree.nodes] : [],
  trunk: existingTree ? [...existingTree.trunk] : [],
  petioleMap: existingTree ? { ...existingTree.petioleMap } : {},
  level: 0,
  currentAncestors: [],
  isUpdate: !!existingTree,
  subroot: options.subroot,
  updatedNodes: [],
});

export const processRoot = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'PROCESSING_ROOT',
    subroot: state.isUpdate
      ? (state.subroot || state.options.subroot || Object.keys(state.content)[0])
      : undefined,
    root: state.isUpdate
      ? state.root
      : (state.subroot || state.options.subroot || Object.keys(state.content)[0]),
    virtualRoot: state.options.virtualTrunk
      ? (state.isUpdate
        ? state.root!
        : (state.subroot || state.options.subroot || Object.keys(state.content)[0]))
      : undefined,
    // root: newRoot,
  };
};

export const processBranch = (state: TreeBuilderState, branchText: string): TreeBuilderState => {
  let branchNode = state.nodes.find(node => node.text === branchText);
  if (!branchNode) {
    branchNode = {
      text: branchText,
      ancestors: [...state.currentAncestors],
      children: [],
    };
    state.nodes.push(branchNode);
  }

  if (state.isUpdate) {
    if (state.subroot === branchText) {
      state.currentAncestors = [...branchNode.ancestors];
      state.level = branchNode.ancestors.length;
    }
    branchNode.children = [];
    state.updatedNodes.push(branchNode);
  }

  if (!state.options.virtualTrunk) {
    if (state.root === branchText) {
      state.petioleMap[branchText] = state.root;
    }
    if (!state.trunk.includes(branchText)) {
      state.trunk.push(branchText);
    }
  }

  return {
    ...state,
    state: 'PROCESSING_BRANCH',
    currentAncestors: [...state.currentAncestors, branchText],
  };
};

export const processLeaf = (state: TreeBuilderState, line: string, level: number, branchText: string): TreeBuilderState => {
  const trimmedLine = line.trim();
  if (!trimmedLine) return state;
  const leafText = rawText(trimmedLine, {
    hasBullets: state.options.mkdnList,
    hasWiki: state.options.wikitext,
  });

  state.currentAncestors = state.currentAncestors.slice(0, level + state.level);

  const parent = state.currentAncestors[state.currentAncestors.length - 1];
  const parentNode = state.nodes.find(node => node.text === parent);
  if (parentNode && !parentNode.children.includes(leafText)) {
    parentNode.children.push(leafText);
  }

  let leafNode = state.nodes.find(node => node.text === leafText);
  if (!leafNode) {
    leafNode = {
      text: leafText,
      ancestors: [...state.currentAncestors],
      children: [],
    };
    state.nodes.push(leafNode);
  }
  if (state.isUpdate) {
    leafNode.ancestors = [...state.currentAncestors];
    leafNode.children = [];
    state.updatedNodes.push(leafNode);
  }
  if (!state.options.virtualTrunk) {
    state.petioleMap[leafText] = branchText;
  }

  return {
    ...state,
    state: 'PROCESSING_LEAF',
    currentAncestors: [...state.currentAncestors, leafText],
  };
};

export const getLevel = (line: string, indentSize: number): number => {
  const match = line.match(RGX_INDENT);
  return match ? Math.floor(match[0].length / indentSize) : 0;
};

export const finalize = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'FINALIZING',
    root: state.options.virtualTrunk ? state.virtualRoot! : state.root!,
    trunk: state.options.virtualTrunk ? [] : state.trunk,
    petioleMap: state.options.virtualTrunk ? {} : state.petioleMap,
  };
};

export const lintContent = (state: TreeBuilderState): TreeBuilderState => {
  const contentAsStrings = Object.fromEntries(
    Object.entries(state.content).map(([key, value]) => [key, value.join('\n')])
  );
  const lintError = lint(contentAsStrings, state.options.indentSize || 2);
  if (lintError) {
    throw new Error(lintError);
  }
  return state;
};

export const checkForDuplicates = (state: TreeBuilderState): TreeBuilderState => {
  const hasDups = checkDuplicates(state.nodes);
  if (typeof hasDups === 'string') {
    throw new Error(hasDups);
  }
  return state;
};

export const pruneDanglingNodes = (state: TreeBuilderState): TreeBuilderState => {
  const pruned = pruneDangling({
    root: state.root!,
    trunk: state.trunk,
    petioleMap: state.petioleMap,
    nodes: state.nodes,
  });

  if (typeof pruned === 'string') {
    throw new Error(pruned);
  }

  return {
    ...state,
    nodes: pruned.nodes,
    trunk: pruned.trunk,
    petioleMap: pruned.petioleMap,
  };
};

export const storeState = (state: TreeBuilderState): TreeBuilderState => ({
  ...state,
  originalState: {
    nodes: state.nodes.map(node => ({ ...node })),
    trunk: [...state.trunk],
    petioleMap: { ...state.petioleMap },
  },
});

export const restoreState = (state: TreeBuilderState): TreeBuilderState => ({
  ...state,
  nodes: state.originalState?.nodes || [],
  trunk: state.originalState?.trunk || [],
  petioleMap: state.originalState?.petioleMap || {},
});