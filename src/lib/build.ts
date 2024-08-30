import type {
  SemTree,
  SemTreeOpts,
  TreeBuilderState,
} from './types';
import {
  createInitialState,
  extractContent,
  lintContent,
  processRoot,
  processBranch,
  processLeaf,
  pruneOrphanNodes,
  storeState,
  finalize,
  restoreState,
} from './state';
import { checkComment, getLevel, rawText } from './text';


export const build = (
  root: string,
  content: Record<string, string>,
  opts: SemTreeOpts,
  existingTree?: SemTree,
): SemTree | string => {
  let state: TreeBuilderState | undefined;
  try {
    // check
    if (!content || Object.keys(content).length === 0) {
      return 'semtree.build(): no content provided';
    }
    // go
    state = createInitialState(root, content, opts, existingTree);
    state = extractContent(state);
    state = processRoot(state);
    state = lintContent(state);
    if (state.isUpdate) {
      state = storeState(state);
    }

    const processContent = (currentState: TreeBuilderState, currentBranch: string, isRootFile: boolean = true): TreeBuilderState => {
      let updatedState: TreeBuilderState = currentState;
      if (!currentState.opts.virtualTrunk) {
        updatedState = processBranch(updatedState, currentBranch);
        updatedState.level += 1;
      }
      const lines: string[] = updatedState.content[currentBranch].split('\n');
      for (const line of lines) {
        if (checkComment(line)) { continue; }
        const thisLvl: number = getLevel(line, updatedState.opts.indentSize || 2);
        const leafText: string = rawText(line.trim(), {
          hasBullets: updatedState.opts.mkdnBullet,
          hasWiki: updatedState.opts.wikiLink,
        });
        // Handle root setting for virtual trunk mode
        if (updatedState.opts.virtualTrunk
          && ((updatedState.level + thisLvl) === 0)
          && !Object.keys(updatedState.content).includes(leafText)
        ) {
          if (updatedState.virtualRoot === root) {
            updatedState.virtualRoot = leafText;
          } else {
            throw new Error(`semtree.build(): cannot have multiple root nodes, node "${leafText}" at same level as root node "${updatedState.virtualRoot}"`);
          }
        }
        // always process the leaf unless it's a trunk file in virtual trunk mode
        if (!updatedState.opts.virtualTrunk || !Object.keys(updatedState.content).includes(leafText)) {
          updatedState = processLeaf(updatedState, line, thisLvl, currentBranch);
        }
        // branch handling
        if (Object.keys(updatedState.content).includes(leafText)) {
          updatedState.level += thisLvl;
          updatedState = processContent(updatedState, leafText, false);
          updatedState.level -= thisLvl;
        }
      }
      if (updatedState.opts.virtualTrunk && isRootFile && updatedState.root === null) {
        throw new Error('semtree.build(): no root-level entry found in virtual trunk mode');
      }
      if (!currentState.opts.virtualTrunk) {
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
    if (state && state.isUpdate) {
      state = restoreState(state);
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'semtree.build(): an unknown error occurred';
  }
};
