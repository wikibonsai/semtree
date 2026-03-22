import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { storeState } from '../../src/lib/state';


describe('state 4; storeState()', () => {

  let opts: SemTreeOpts;
  let state: TreeBuilderState;

  beforeEach(() => {
    opts = {
      virtualBranches: false,
      delimiter: 'semtree',
      indentKind: 'space',
      indentSize: 2,
      mkdnBullet: true,
      wikiLink: true,
    };
    state = {
      state: 'PROCESSING_ROOT',
      opts: opts,
      content: {},
      root: 'root',
      nodes: [
        { text: 'root', ancestors: [], children: ['child'] },
        { text: 'child', ancestors: ['root'], children: [] },
      ],
      branches: ['root'],
      petioleMap: { 'root': 'root', 'child': 'root' },
      orphanedBranches: [],
      level: 0,
      currentAncestors: [],
      isUpdate: true,
      updatedNodes: [],
    };
  });

  it('stores the current state', () => {
    assert.strictEqual(state.originalState, undefined, 'before this state, originalState is undefined');
    // go
    const result = storeState(state);
    // assert
    assert.strictEqual(result.state, 'STORING_STATE');
    assert.deepStrictEqual(result.originalState, {
      root: 'root',
      nodes: [
        { text: 'root', ancestors: [], children: ['child'] },
        { text: 'child', ancestors: ['root'], children: [] },
      ],
      branches: ['root'],
      petioleMap: { 'root': 'root', 'child': 'root' },
      orphanedBranches: [],
    });
    assert.notStrictEqual(result.originalState.nodes, state.nodes);
    assert.notStrictEqual(result.originalState.branches, state.branches);
    assert.notStrictEqual(result.originalState.petioleMap, state.petioleMap);
    assert.notStrictEqual(result.originalState.orphanedBranches, state.orphanedBranches);
  });

});