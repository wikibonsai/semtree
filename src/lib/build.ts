import { SemTree, SemTreeOpts } from './types';
import {
  createInitialState,
  lintContent,
  processRoot,
  processChildren,
  checkForDuplicates,
  pruneDanglingNodes,
  storeState,
  finalize,
} from './state';


export const build = (
  root: string,
  content: Record<string, string[]>,
  options: SemTreeOpts,
  existingTree?: SemTree,
): SemTree | string => {
  try {
    const initialState = createInitialState(root, content, options);
    if (!initialState.content || Object.keys(initialState.content).length === 0) {
      return 'semtree.build(): No content provided';
    }

    const lintedState = lintContent(initialState);
    const storedState = storeState(lintedState);
    const stateWithRoot = processRoot(storedState);
    const stateWithChildren = processChildren(stateWithRoot);
    const checkedState = checkForDuplicates(stateWithChildren);
    // const prunedState = pruneDanglingNodes(checkedState);
    // const finalState = finalize(prunedState);
    const finalState = finalize(checkedState);

    if (Object.keys(finalState.content).length > 0) {
      const unprocessedFiles = Object.keys(finalState.content).join(', ');
      return `semtree.build(): some files were not processed: ${unprocessedFiles}`;
    }

    if (!options.virtualTrunk && (!finalState.trunk || finalState.trunk.length === 0)) {
      return 'semtree.build(): No trunk generated';
    }

    return {
      root: finalState.root ?? '',
      trunk: finalState.trunk,
      petioleMap: finalState.petioleMap,
      nodes: finalState.nodes,
    };
  } catch (error) {
    if (error instanceof Error) {
      return `semtree.build(): ${error.message}`;
    }
    return 'semtree.build(): An unknown error occurred';
  }
};