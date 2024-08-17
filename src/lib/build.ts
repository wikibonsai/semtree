import type {
  SemTree,
  SemTreeOpts,
  TreeBuilderState,
} from './types';
import {
  createInitialState,
  lintContent,
  processRoot,
  processBranch,
  processLeaf,
  checkForDuplicates,
  pruneDanglingNodes,
  storeState,
  finalize,
  getLevel,
} from './state';
import { rawText } from './text';

export const build = (
  root: string,
  content: Record<string, string[]>,
  options: SemTreeOpts,
  existingTree?: SemTree,
): SemTree | string => {
  try {
    if (!content || Object.keys(content).length === 0) {
      return 'semtree.build(): No content provided';
    }

    let state = createInitialState(root, content, options, existingTree);
    state = lintContent(state);
    state = storeState(state);
    state = processRoot(state);

    const processContent = (currentState: TreeBuilderState, currentBranch: string): TreeBuilderState => {
      if (!currentState.content[currentBranch]) {
        return currentState;
      }
      let updatedState = processBranch(currentState, currentBranch);
      updatedState.level += 1;
      for (const line of updatedState.content[currentBranch]) {
        const thisLvl: number = getLevel(line, state.options.indentSize || 2);
        updatedState = processLeaf(updatedState, line, thisLvl, currentBranch);
        const leafText = rawText(line.trim(), {
          hasBullets: updatedState.options.mkdnList,
          hasWiki: updatedState.options.wikitext,
        });
        if (updatedState.content[leafText]) {
          updatedState.level += thisLvl;
          updatedState = processContent(updatedState, leafText);
          updatedState.level -= thisLvl;
        }
      }
      updatedState.level -= 1;
      delete updatedState.content[currentBranch];
      return updatedState;
    };

    state = processContent(state, state.isUpdate ? state.subroot! : state.root!);

    state = checkForDuplicates(state);
    state = pruneDanglingNodes(state);
    state = finalize(state);

    if (options.virtualTrunk) {
      state.trunk = [];
      state.petioleMap = {};
    }

    if (Object.keys(state.content).length > 0) {
      const unprocessedFiles = Object.keys(state.content).join(', ');
      return `semtree.build(): some files were not processed: ${unprocessedFiles}`;
    }

    if (!options.virtualTrunk && (!state.trunk || state.trunk.length === 0)) {
      return 'semtree.build(): No trunk generated';
    }

    return {
      root: state.root ?? '',
      trunk: state.trunk,
      petioleMap: state.petioleMap,
      nodes: state.nodes,
    };
  } catch (error) {
    if (error instanceof Error) {
      return `semtree.build(): ${error.message}`;
    }
    return 'semtree.build(): An unknown error occurred';
  }
};
