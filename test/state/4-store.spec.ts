import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { storeState } from '../../src/lib/state';


describe('state 4; storeState()', () => {

  let opts: SemTreeOpts;
  let state: TreeBuilderState;

  beforeEach(() => {
    opts = {
      virtualTrunk: false,
      delimiter: 'semtree',
      indentKind: 'space',
      indentSize: 2,
      mkdnList: true,
      wikitext: true,
    };
    state = {
      state: 'PROCESSING_ROOT',
      options: opts,
      content: {},
      root: 'root',
      nodes: [
        { text: 'root', ancestors: [], children: ['child'] },
        { text: 'child', ancestors: ['root'], children: [] },
      ],
      trunk: ['root'],
      petioleMap: { 'root': 'root', 'child': 'root' },
      orphans: [],
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
      trunk: ['root'],
      petioleMap: { 'root': 'root', 'child': 'root' },
      orphans: [],
    });
    assert.notStrictEqual(result.originalState.nodes, state.nodes);
    assert.notStrictEqual(result.originalState.trunk, state.trunk);
    assert.notStrictEqual(result.originalState.petioleMap, state.petioleMap);
    assert.notStrictEqual(result.originalState.orphans, state.orphans);
  });

});