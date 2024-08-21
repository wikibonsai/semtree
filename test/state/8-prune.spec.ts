import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { pruneOrphanNodes } from '../../src/lib/state';


describe('state 8; pruneOrphanNodes()', () => {

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
      state: 'PROCESSING_LEAF',
      opts: opts,
      content: {},
      // tree
      root: 'root',
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

  it('update; has orphan branch', () => {
    state.nodes = [
      { text: 'root', ancestors: [], children: ['child-1'] },
      { text: 'child-1', ancestors: ['root'], children: [] },
      { text: 'branch', ancestors: ['root'], children: ['child-2'] },
      { text: 'child-2', ancestors: ['branch'], children: [] },
    ];
    // go
    const result: TreeBuilderState = pruneOrphanNodes(state);
    // assert
    assert.strictEqual(result.state, 'PRUNING_ORPHANS');
    assert.strictEqual(result.nodes.find(n => n.text === 'branch'), undefined);
  });

  it('update; has orphan leaves', () => {
    state.nodes = [
      { text: 'root', ancestors: [], children: ['child-1'] },
      { text: 'child-1', ancestors: ['root'], children: [] },
      { text: 'child-2', ancestors: ['root'], children: [] },
    ];
    // go
    const result: TreeBuilderState = pruneOrphanNodes(state);
    // assert
    assert.strictEqual(result.state, 'PRUNING_ORPHANS');
    assert.strictEqual(result.nodes.find(n => n.text === 'child-2'), undefined);
  });

  it('update; no orphans -- no prune', () => {
    state.nodes = [
      { text: 'root', ancestors: [], children: ['child-1', 'branch'] },
      { text: 'child-1', ancestors: ['root'], children: [] },
      { text: 'branch', ancestors: ['root'], children: ['child-2'] },
      { text: 'child-2', ancestors: ['branch'], children: [] },
    ];
    // go
    const result: TreeBuilderState = pruneOrphanNodes(state);
    // assert
    assert.strictEqual(result.state, 'PRUNING_ORPHANS');
    assert.deepStrictEqual(state.nodes, result.nodes);
  });


});
