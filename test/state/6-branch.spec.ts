import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { processBranch } from '../../src/lib/state';


describe('state 6; processBranch()', () => {

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
      state: 'INITIAL',
      opts: opts,
      content: {},
      root: null,
      nodes: [],
      trunk: [],
      petioleMap: {},
      orphans: [],
      level: 0,
      currentAncestors: [],
      isUpdate: false,
      updatedNodes: [],
    };
  });

  // create

  it('create; concrete trunk; add node; root case', () => {
    // go
    const result: TreeBuilderState = processBranch(state, 'root');
    // assert
    assert.strictEqual(result.state, 'PROCESSING_BRANCH');
    assert.strictEqual(result.nodes.length, 1);
    assert.deepStrictEqual(result.nodes[0], {
      text: 'root',
      ancestors: [],
      children: [], // see 'processLeaf()' for children population
    });
    assert.deepStrictEqual(result.trunk, ['root']);
  });

  it('create; concrete trunk; add node; branch case', () => {
    // setup
    state.nodes = [
      { text: 'root', ancestors: [], children: ['node-1', 'branch'] },
      { text: 'node-1', ancestors: ['root'], children: [] },
    ];
    state.trunk = ['root'];
    state.currentAncestors = ['root'];
    // go
    const result: TreeBuilderState = processBranch(state, 'branch');
    // assert
    assert.strictEqual(result.state, 'PROCESSING_BRANCH');
    assert.strictEqual(result.nodes.length, 3);
    assert.deepStrictEqual(result.nodes, [
      { text: 'root', ancestors: [], children: ['node-1', 'branch'], },
      { text: 'node-1', ancestors: ['root'], children: [], },
      { text: 'branch', ancestors: ['root'], children: [], },
    ]);
    assert.deepStrictEqual(result.trunk, ['root', 'branch']);
  });

  // update

  it('update; concrete trunk; add node; root case', () => {
    // setup
    state.isUpdate = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: ['node-1', 'node-3'] },
      { text: 'node-1', ancestors: ['root'], children: [] },
      { text: 'node-3', ancestors: ['root'], children: [] },
    ];
    state.trunk = ['root'];
    state.currentAncestors = ['root'];
    // go
    const result: TreeBuilderState = processBranch(state, 'root');
    // assert
    assert.strictEqual(result.state, 'PROCESSING_BRANCH');
    assert.strictEqual(result.nodes.length, 3);
    assert.strictEqual(result.updatedNodes.length, 1);
    assert.deepStrictEqual(result.nodes, [
      { text: 'root', ancestors: [], children: [] },
      { text: 'node-1', ancestors: ['root'], children: [] },
      { text: 'node-3', ancestors: ['root'], children: [] },
    ]);
    assert.deepStrictEqual(result.trunk, ['root']);
  });

  it('update; concrete trunk; node exists; root case', () => {
    // setup
    state.isUpdate = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: ['node-1', 'node-3'] },
      { text: 'node-1', ancestors: ['root'], children: [] },
      { text: 'node-3', ancestors: ['root'], children: [] },
    ];
    // go
    const result: TreeBuilderState = processBranch(state, 'root');
    // assert
    assert.strictEqual(result.state, 'PROCESSING_BRANCH');
    assert.strictEqual(result.nodes.length, 3);
    assert.strictEqual(result.updatedNodes.length, 1);
    assert.deepStrictEqual(result.nodes, [
      { text: 'root', ancestors: [], children: [] },
      { text: 'node-1', ancestors: ['root'], children: [] },
      { text: 'node-3', ancestors: ['root'], children: [] },
    ]);
    assert.deepStrictEqual(result.trunk, ['root']);
  });

  it('update; concrete trunk; node exists; branch case', () => {
    // setup
    state.isUpdate = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: ['node-1', 'branch'] },
      { text: 'node-1', ancestors: ['root'], children: [] },
      { text: 'branch', ancestors: ['root'], children: ['leaf-1'] },
      { text: 'leaf-1', ancestors: ['root', 'branch'], children: [] },
    ];
    state.trunk = ['root'];
    state.currentAncestors = ['root'];
    // go
    const result: TreeBuilderState = processBranch(state, 'branch');
    // assert
    assert.strictEqual(result.state, 'PROCESSING_BRANCH');
    assert.strictEqual(result.nodes.length, 4);
    assert.strictEqual(result.updatedNodes.length, 1);
    assert.deepStrictEqual(result.nodes, [
      { text: 'root', ancestors: [], children: ['node-1', 'branch'] },
      { text: 'node-1', ancestors: ['root'], children: [] },
      { text: 'branch', ancestors: ['root'], children: [] },
      { text: 'leaf-1', ancestors: ['root', 'branch'], children: [] },
    ]);
    assert.deepStrictEqual(result.trunk, ['root', 'branch']);
  });

  it('virtual trunk; branches do not exist in virtual trunk mode', () => {
    // setup
    state.opts.virtualTrunk = true;
    // go
    const result: TreeBuilderState = processBranch(state, 'root');
    // assert
    assert.deepStrictEqual(result, state);
  });

});
