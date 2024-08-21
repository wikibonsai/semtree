import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { finalize } from '../../src/lib/state';


describe('state 9; finalize()', () => {

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
      state: 'PRUNING_ORPHANS',
      options: opts,
      content: {},
      // tree
      root: null,
      nodes: [],
      trunk: [],
      petioleMap: {},
      orphans: [],
      // processing
      level: 0,
      currentAncestors: [],
      isUpdate: false,
      updatedNodes: [],
    };
  });

  // ...see? this doesn't really do much with concrete trunks
  it('concrete trunk', () => {
    // setup
    state.root = 'root';
    // go
    const result: TreeBuilderState = finalize(state);
    // assert
    assert.strictEqual(result.state, 'FINALIZING');
    assert.strictEqual(result.root, 'root');
    assert.deepStrictEqual(result.trunk, []);
    assert.deepStrictEqual(result.petioleMap, {});
    assert.deepStrictEqual(result.orphans, []);
  });

  // oh right -- it does set trunk orphans...
  it('concrete trunk', () => {
    // setup
    state.content = {
      // 'root': ['- [[child1a]]'], // imagine this was the full content and it's been processed already
      'branch': ['- [[child1b]]'],
    };
    state.root = 'root';
    state.trunk = ['root'];
    state.petioleMap = {
      'root': 'root',
      'child1a': 'root',
    };
    // go
    const result: TreeBuilderState = finalize(state);
    // assert
    assert.strictEqual(result.state, 'FINALIZING');
    assert.strictEqual(result.root, 'root');
    assert.deepStrictEqual(result.trunk, ['root']);
    assert.deepStrictEqual(result.petioleMap, {
      'root': 'root',
      'child1a': 'root',
    });
    assert.deepStrictEqual(result.orphans, ['branch']);
  });

  // but finalize is mostly for making sure
  // trunk-related properties are empty in virtual trunk mode...
  it('virtual trunk', () => {
    // setup
    state.options.virtualTrunk = true;
    state.virtualRoot = 'virtual-root';
    // go
    const result: TreeBuilderState = finalize(state);
    // assert
    assert.strictEqual(result.state, 'FINALIZING');
    assert.strictEqual(result.root, 'virtual-root');
    assert.deepStrictEqual(result.trunk, []);
    assert.deepStrictEqual(result.petioleMap, {});
    assert.deepStrictEqual(result.orphans, []);
  });

});
