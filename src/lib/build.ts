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
  pruneOrphanNodes,
  storeState,
  finalize,
} from './state';
import { checkComment, getLevel, rawText } from './text';


export const build = (
  root: string,
  content: Record<string, string[]>,
  options: SemTreeOpts,
  existingTree?: SemTree,
): SemTree | string => {
  try {
    if (!content || Object.keys(content).length === 0) {
      return 'semtree.build(): no content provided';
    }
    // go
    let state = createInitialState(root, content, options, existingTree);
    state = processRoot(state);
    state = lintContent(state);
    if (state.isUpdate) {
      state = storeState(state);
    }

    const processContent = (currentState: TreeBuilderState, currentBranch: string, isRootFile: boolean = true): TreeBuilderState => {
      if (!currentState.content[currentBranch]) {
        return currentState;
      }
      let updatedState = currentState;
      if (!currentState.options.virtualTrunk) {
        updatedState = processBranch(updatedState, currentBranch);
        updatedState.level += 1;
      }
      for (const line of updatedState.content[currentBranch]) {
        if (checkComment(line)) { continue; }
        const thisLvl: number = getLevel(line, updatedState.options.indentSize || 2);
        const leafText = rawText(line.trim(), {
          hasBullets: updatedState.options.mkdnList,
          hasWiki: updatedState.options.wikitext,
        });
        // Handle root setting for virtual trunk mode
        if (updatedState.options.virtualTrunk
          && ((updatedState.level + thisLvl) === 0)
          && !updatedState.content[leafText]
        ) {
          if (updatedState.virtualRoot === root) {
            updatedState.virtualRoot = leafText;
          } else {
            throw new Error(`semtree.build(): cannot have multiple root nodes, node "${leafText}" at same level as root node "${updatedState.virtualRoot}"`);
          }
        }
        // always process the leaf unless it's a trunk file in virtual trunk mode
        if (!updatedState.options.virtualTrunk || !updatedState.content[leafText]) {
          updatedState = processLeaf(updatedState, line, thisLvl, currentBranch);
        }
        // branch handling
        if (updatedState.content[leafText]) {
          updatedState.level += thisLvl;
          updatedState = processContent(updatedState, leafText, false);
          updatedState.level -= thisLvl;
        }
      }
      if (updatedState.options.virtualTrunk && isRootFile && updatedState.root === null) {
        throw new Error('semtree.build(): no root-level entry found in virtual trunk mode');
      }
      if (!currentState.options.virtualTrunk) {
        updatedState.level -= 1;
      }
      delete updatedState.content[currentBranch];
      return updatedState;
    };

    state = processContent(state, state.isUpdate ? state.subroot! : state.root!, true);
    if (state.isUpdate) {
      state = pruneOrphanNodes(state);
    }
    state = finalize(state);
    // return
    return {
      root: state.root ?? '',
      trunk: state.trunk,
      petioleMap: state.petioleMap,
      nodes: state.nodes,
      orphans: state.orphans,
    };
  } catch (error) {
    if (error instanceof Error) {
      return error.message;
    }
    return 'semtree.build(): an unknown error occurred';
  }
};
