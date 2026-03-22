import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { finalize } from '../../src/lib/state';


describe('state 9; finalize()', () => {

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
      state: 'PRUNING_ORPHANS',
      opts: opts,
      content: {},
      // tree
      root: null,
      nodes: [],
      branches: [],
      petioleMap: {},
      orphanedBranches: [],
      // processing
      level: 0,
      currentAncestors: [],
      isUpdate: false,
      updatedNodes: [],
    };
  });

  // ...see? this doesn't really do much with concrete branches
  it('concrete branches', () => {
    // setup
    state.root = 'root';
    // go
    const result: TreeBuilderState = finalize(state);
    // assert
    assert.strictEqual(result.state, 'FINALIZING');
    assert.strictEqual(result.root, 'root');
    assert.deepStrictEqual(result.branches, []);
    assert.deepStrictEqual(result.petioleMap, {});
    assert.deepStrictEqual(result.orphanedBranches, []);
  });

  // oh right -- it does set orphaned branches...
  it('concrete branches', () => {
    // setup
    state.content = {
      // 'root': ['- [[child1a]]'], // imagine this was the full content and it's been processed already
      'branch': '- [[child1b]]\n',
    };
    state.root = 'root';
    state.branches = ['root'];
    state.petioleMap = {
      'root': 'root',
      'child1a': 'root',
    };
    // go
    const result: TreeBuilderState = finalize(state);
    // assert
    assert.strictEqual(result.state, 'FINALIZING');
    assert.strictEqual(result.root, 'root');
    assert.deepStrictEqual(result.branches, ['root']);
    assert.deepStrictEqual(result.petioleMap, {
      'root': 'root',
      'child1a': 'root',
    });
    assert.deepStrictEqual(result.orphanedBranches, ['branch']);
  });

  // but finalize is mostly for making sure
  // branch-related properties are empty in virtual branches mode...
  it('virtual branches', () => {
    // setup
    state.opts.virtualBranches = true;
    state.virtualRoot = 'virtual-root';
    // go
    const result: TreeBuilderState = finalize(state);
    // assert
    assert.strictEqual(result.state, 'FINALIZING');
    assert.strictEqual(result.root, 'virtual-root');
    assert.deepStrictEqual(result.branches, []);
    assert.deepStrictEqual(result.petioleMap, {});
    assert.deepStrictEqual(result.orphanedBranches, []);
  });

});
