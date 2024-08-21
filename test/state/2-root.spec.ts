import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { processRoot } from '../../src/lib/state';


describe('state 2; processRoot()', () => {

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
      options: opts,
      content: {},
      root: 'root',
      nodes: [],
      trunk: [],
      petioleMap: {},
      orphans: [],
      level: 0,
      currentAncestors: [],
      isUpdate: false,
      updatedNodes: [],
      subroot: undefined,
    };
  });

  it('create; concrete trunk', () => {
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.options.virtualTrunk, false);
    assert.strictEqual(result.virtualRoot, undefined);
    assert.strictEqual(result.subroot, undefined);
  });

  it('create; virtual trunk', () => {
    // setup
    state.options.virtualTrunk = true;
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.options.virtualTrunk, true);
    assert.strictEqual(result.virtualRoot, undefined);
    assert.strictEqual(result.subroot, undefined);
  });

  it('update; concrete trunk', () => {
    // setup
    state.isUpdate = true;
    state.options.subroot = 'root';
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.options.virtualTrunk, false);
    assert.strictEqual(result.virtualRoot, undefined);
    assert.strictEqual(result.subroot, 'root');
  });

  it('update; virtual trunk', () => {
    // setup
    state.isUpdate = true;
    state.options.virtualTrunk = true;
    state.options.subroot = 'root';
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.options.virtualTrunk, true);
    assert.strictEqual(result.virtualRoot, 'root');
    assert.strictEqual(result.subroot, 'root');
  });

});
