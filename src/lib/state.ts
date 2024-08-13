import { TreeNode, SemTreeOpts } from './types';
import { lint } from './lint';
import { pruneDangling } from './dangling';
import { checkDuplicates } from './duplicates';
import { rawText, getIndentSize } from './text';


type TreeBuildingState = 'INITIAL'
                        | 'PROCESSING_ROOT'
                        | 'PROCESSING_CHILDREN' | 'FINALIZING';

type TreeBuilderState = {
  state: TreeBuildingState;
  root: string | null;
  content: Record<string, string[]>;
  options: SemTreeOpts;
  nodes: TreeNode[];
  trunk: string[];
  petioleMap: Record<string, string>;
  currentAncestors: string[];
  originalState?: { nodes: TreeNode[], trunk: string[], petioleMap: Record<string, string> };
};

// building

export const createInitialState = (root: string, content: Record<string, string[]>, options: SemTreeOpts): TreeBuilderState => ({
  state: 'INITIAL',
  root: null,
  content,
  options,
  nodes: [],
  trunk: [],
  petioleMap: {},
  currentAncestors: [],
});

export const processRoot = (state: TreeBuilderState): TreeBuilderState => ({
  ...state,
  state: 'PROCESSING_ROOT',
  root: state.options.subroot || Object.keys(state.content)[0],
});

export const processChildren = (state: TreeBuilderState): TreeBuilderState => {
  const indentSize = getIndentSize(state.root!, state.content);
  if (typeof indentSize === 'string') {
    throw new Error(indentSize);
  }

  const getLevel = (line: string): number => {
    const match = line.match(/^\s*/);
    return match ? Math.floor(match[0].length / indentSize) : 0;
  };

  const processNode = (nodeState: TreeBuilderState, nodeText: string, isRoot: boolean, baseLevel: number = 0): TreeBuilderState => {
    const isVirtualTrunk = nodeState.options.virtualTrunk;

    // Add the current node to the tree if it doesn't exist
    let node: TreeNode | undefined = nodeState.nodes.find(node => node.text === nodeText);
    if (!node) {
      node = {
        text: nodeText,
        ancestors: [...nodeState.currentAncestors],
        children: [],
      };
      nodeState.nodes.push(node);
    }
    if (!isVirtualTrunk) {
      if (isRoot) {
        nodeState.root = nodeText;
        nodeState.petioleMap[nodeText] = nodeState.root;
        nodeState.currentAncestors = [...nodeState.currentAncestors, nodeText];
      }
      baseLevel += 1;
    }

    // Process the content of the node
    const nodeContent = nodeState.content[nodeText] || [];

    const processLine = (lineState: TreeBuilderState, line: string): TreeBuilderState => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return lineState;

      const level: number = getLevel(line) + baseLevel;
      const childText: string = rawText(trimmedLine, {
        hasBullets: lineState.options.mkdnList,
        hasWiki: lineState.options.wikitext,
      });

      // Adjust currentAncestors based on the level
      lineState.currentAncestors = lineState.currentAncestors.slice(0, level);

      const parent = lineState.currentAncestors[lineState.currentAncestors.length - 1] || nodeText;
      const parentNode = lineState.nodes.find(node => node.text === parent);
      if (parentNode && !parentNode.children.includes(childText)) {
        parentNode.children.push(childText);
      }

      let childNode = lineState.nodes.find(node => node.text === childText);
      if (!childNode) {
        childNode = {
          text: childText,
          ancestors: [...lineState.currentAncestors],
          children: [],
        };
        lineState.nodes.push(childNode);
      }
      if (!isVirtualTrunk) {
        lineState.petioleMap[childText] = nodeText;
      }

      // Update currentAncestors for the next iteration
      lineState.currentAncestors = [...lineState.currentAncestors, childText];

      // If the childText is a key in content, process it recursively
      if (lineState.content[childText]) {
        return processNode({
          ...lineState,
          currentAncestors: lineState.currentAncestors,
        }, childText, false, level);
      }

      return lineState;
    };

    const finalNodeState = nodeContent.reduce<TreeBuilderState>(
      (state, line) => processLine(state, line),
      {
        ...nodeState,
        currentAncestors: [...nodeState.currentAncestors],
      }
    );

    // Remove the processed content
    delete finalNodeState.content[nodeText];
    return finalNodeState;
  };

  const initialState: TreeBuilderState = {
    ...state,
    state: 'PROCESSING_CHILDREN',
    currentAncestors: [],
    nodes: [],
    petioleMap: {},
    trunk: state.options.virtualTrunk ? [] : Object.keys(state.content),
  };

  // Process all content keys as nodes
  const processedState = Object.keys(state.content).reduce(
    (accState, key) => processNode(accState, key, key === state.root),
    initialState
  );

  return processedState;
};

export const finalize = (state: TreeBuilderState): TreeBuilderState => {
  return {
    ...state,
    state: 'FINALIZING',
  };
};

// validation

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

// state

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
