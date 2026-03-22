import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { processRoot } from '../../src/lib/state';


describe('state 2; processRoot()', () => {

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
      state: 'INITIAL',
      opts: opts,
      content: {},
      root: 'root',
      nodes: [],
      branches: [],
      petioleMap: {},
      orphanedBranches: [],
      level: 0,
      currentAncestors: [],
      isUpdate: false,
      updatedNodes: [],
      subroot: undefined,
    };
  });

  it('create; concrete branches', () => {
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.opts.virtualBranches, false);
    assert.strictEqual(result.virtualRoot, undefined);
    assert.strictEqual(result.subroot, undefined);
  });

  it('create; virtual branches', () => {
    // setup
    state.opts.virtualBranches = true;
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.opts.virtualBranches, true);
    assert.strictEqual(result.virtualRoot, undefined);
    assert.strictEqual(result.subroot, undefined);
  });

  it('update; concrete branches', () => {
    // setup
    state.isUpdate = true;
    state.opts.subroot = 'root';
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.opts.virtualBranches, false);
    assert.strictEqual(result.virtualRoot, undefined);
    assert.strictEqual(result.subroot, 'root');
  });

  it('update; virtual branches', () => {
    // setup
    state.isUpdate = true;
    state.opts.virtualBranches = true;
    state.opts.subroot = 'root';
    // go
    const result = processRoot(state);
    // assert
    assert.strictEqual(result.root, 'root');
    assert.strictEqual(result.opts.virtualBranches, true);
    assert.strictEqual(result.virtualRoot, 'root');
    assert.strictEqual(result.subroot, 'root');
  });

});
