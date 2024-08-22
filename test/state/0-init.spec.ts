import assert from 'node:assert/strict';

import type { SemTreeOpts, SemTree, TreeBuilderState } from '../../src/lib/types';
import { createInitialState } from '../../src/lib/state';


describe('state 0; createInitialState()', () => {

  let opts: SemTreeOpts;

  beforeEach(() => {
    opts = {
      virtualTrunk: false,
      delimiter: 'semtree',
      indentKind: 'space',
      indentSize: 2,
      mkdnBullet: true,
      wikiLink: true,
    };
  });

  it('create tree; concrete trunk', () => {
    // go
    const result = createInitialState('root', {}, opts);
    // assert
    assert.deepEqual(result, {
      state: 'INITIAL',
      opts: opts,
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
    });
  });

  it('create tree; virtual trunk', () => {
    // setup
    opts.virtualTrunk = true;
    // go
    const result = createInitialState('root', {}, opts);
    // assert
    assert.deepEqual(result, {
      state: 'INITIAL',
      opts: opts,
      content: {},
      root: 'root', // this should be updated properly in processRoot()
      nodes: [],
      trunk: [],
      petioleMap: {},
      orphans: [],
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
      trunk: ['root'],
      petioleMap: { 'root': 'root', 'node-2': 'root' },
      orphans: [],
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
      trunk: tree.trunk,
      petioleMap: tree.petioleMap,
      orphans: tree.orphans,
      level: 0,
      currentAncestors: [],
      isUpdate: true,
      updatedNodes: [],
      subroot: undefined,
    });
  });

});
