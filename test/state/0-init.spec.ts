import assert from 'node:assert/strict';

import type { SemTreeOpts, SemTree, TreeBuilderState } from '../../src/lib/types';
import { createInitialState } from '../../src/lib/state';


describe('state 0; createInitialState()', () => {

  let opts: SemTreeOpts;

  beforeEach(() => {
    opts = {
      virtualBranches: false,
      delimiter: 'semtree',
      indentKind: 'space',
      indentSize: 2,
      mkdnBullet: true,
      wikiLink: true,
    };
  });

  it('create tree; concrete branches', () => {
    // go
    const result = createInitialState('root', {}, opts);
    // assert
    assert.deepEqual(result, {
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
    });
  });

  it('create tree; virtual branches', () => {
    // setup
    opts.virtualBranches = true;
    // go
    const result = createInitialState('root', {}, opts);
    // assert
    assert.deepEqual(result, {
      state: 'INITIAL',
      opts: opts,
      content: {},
      root: 'root', // this should be updated properly in processRoot()
      nodes: [],
      branches: [],
      petioleMap: {},
      orphanedBranches: [],
      level: 0,
      currentAncestors: [],
      isUpdate: false,
      updatedNodes: [],
      subroot: undefined,
    });
  });

  it('update tree', () => {
    // setup
    const tree: SemTree = {
      root: 'root',
      nodes: [{ text: 'root', ancestors: [], children: ['node-2'] }, { text: 'node-2', ancestors: [], children: [] }],
      branches: ['root'],
      petioleMap: { 'root': 'root', 'node-2': 'root' },
      orphanedBranches: [],
    };
    // go
    const result: TreeBuilderState = createInitialState('root', {}, opts, tree);
    // assert
    assert.deepEqual(result, {
      state: 'INITIAL',
      opts: opts,
      content: {},
      root: tree.root,
      nodes: tree.nodes,
      branches: tree.branches,
      petioleMap: tree.petioleMap,
      orphanedBranches: tree.orphanedBranches,
      level: 0,
      currentAncestors: [],
      isUpdate: true,
      updatedNodes: [],
      subroot: undefined,
    });
  });

});
