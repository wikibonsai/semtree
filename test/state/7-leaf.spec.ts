import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts, TreeNode } from '../../src/lib/types';
import { processLeaf } from '../../src/lib/state';


describe('state 7; processLeaf()', () => {

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

  // create

  it('create; concrete trunk', () => {
    // setup
    state.nodes = [
      { text: 'root', ancestors: [], children: [] },
    ];
    state.currentAncestors = ['root'];
    const line: string = '- [[leaf]]';
    const level: number = 1;
    const branchText: string = 'root';
    // go
    const result: TreeBuilderState = processLeaf(state, line, level, branchText);
    // assert
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 2);
    assert.deepStrictEqual(result.nodes[1], {
      text: 'leaf',
      ancestors: ['root'],
      children: [],
    });
    assert.strictEqual(result.nodes[0].children.includes('leaf'), true);
    assert.strictEqual(result.petioleMap['leaf'], 'root');
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
  });

  it('create; virtual trunk; root case', () => {
    // setup
    state.options.virtualTrunk = true;
    state.nodes = [];
    state.currentAncestors = [];
    const line: string = '- [[leaf]]';
    const level: number = 1;
    const branchText: string = 'root';
    // go
    const result: TreeBuilderState = processLeaf(state, line, level, branchText);
    // assert
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 1);
    assert.deepStrictEqual(result.nodes[0], {
      text: 'leaf',
      ancestors: [],
      children: [],
    });
    assert.strictEqual(result.petioleMap['leaf'], undefined);
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
  });

  it('create; virtual trunk; with ancestors', () => {
    // setup
    state.options.virtualTrunk = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: [] },
      { text: 'child', ancestors: ['root'], children: [] },
      { text: 'grandchild', ancestors: ['root', 'child'], children: [] },
    ];
    state.currentAncestors = ['root', 'child', 'grandchild'];
    const line: string = '- [[leaf]]';
    const level: number = 3;
    const branchText: string = 'root';
    // go
    const result: TreeBuilderState = processLeaf(state, line, level, branchText);
    // assert
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 4);
    assert.deepStrictEqual(result.nodes[3], {
      text: 'leaf',
      ancestors: ['root', 'child', 'grandchild'],
      children: [],
    });
    assert.strictEqual(result.nodes[2].children.includes('leaf'), true);
    assert.strictEqual(result.petioleMap['leaf'], undefined);
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
  });

  // update

  it('update; concrete trunk; exists; no change', () => {
    // setup
    state.isUpdate = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: [] },
      { text: 'leaf', ancestors: ['root'], children: [] },
    ];
    state.currentAncestors = ['root'];
    const line: string = '- [[leaf]]';
    const level: number = 1;
    const branchText: string = 'root';
    // go
    const result: TreeBuilderState = processLeaf(state, line, level, branchText);
    // assert
    const expdLeafNode: TreeNode = {
      text: 'leaf',
      ancestors: ['root'],
      children: [],
    };
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 2);
    assert.deepStrictEqual(result.nodes[1], expdLeafNode);
    assert.strictEqual(result.nodes[0].children.includes('leaf'), true);
    assert.strictEqual(result.petioleMap['leaf'], 'root');
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
    assert.deepStrictEqual(result.updatedNodes, [expdLeafNode]);
  });

  it('update; concrete trunk; exists; ancestors change', () => {
    // setup
    state.isUpdate = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: [] },
      { text: 'leaf', ancestors: ['root', 'branch'], children: [] },
    ];
    state.currentAncestors = ['root'];
    const line: string = '- [[leaf]]';
    const level: number = 1;
    const branchText: string = 'root';
    // go
    const result: TreeBuilderState = processLeaf(state, line, level, branchText);
    // assert
    const expdLeafNode: TreeNode = {
      text: 'leaf',
      ancestors: ['root'],
      children: [],
    };
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 2);
    assert.deepStrictEqual(result.nodes[1], expdLeafNode);
    assert.strictEqual(result.nodes[0].children.includes('leaf'), true);
    assert.strictEqual(result.petioleMap['leaf'], 'root');
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
    assert.deepStrictEqual(result.updatedNodes, [expdLeafNode]);
  });

  it('update; concrete trunk; exists; children change', () => {
    // setup
    state.isUpdate = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: [] },
      { text: 'leaf', ancestors: ['root', 'branch'], children: [] },
      { text: 'child-leaf', ancestors: ['root', 'branch'], children: [] },
    ];
    state.currentAncestors = ['root'];
    const line: string = '- [[leaf]]';
    const level: number = 1;
    const branchText: string = 'root';
    // go
    const step: TreeBuilderState = processLeaf(state, line, level, branchText);
    const result: TreeBuilderState = processLeaf(step, '  - [[child-leaf]]', 2, branchText);
    // assert
    const expdLeafNode: TreeNode = {
      text: 'leaf',
      ancestors: ['root'],
      children: ['child-leaf'],
    };
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 3);
    assert.deepStrictEqual(result.nodes[1], expdLeafNode);
    assert.strictEqual(result.nodes[0].children.includes('leaf'), true);
    assert.strictEqual(result.petioleMap['leaf'], 'root');
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
    assert.deepStrictEqual(result.updatedNodes, [expdLeafNode, {
      text: 'child-leaf',
      ancestors: ['root', 'leaf'],
      children: [],
    }]);
  });

  it('update; virtual trunk; exists; root case', () => {
    // setup
    state.isUpdate = true;
    state.options.virtualTrunk = true;
    state.nodes = [
      { text: 'leaf', ancestors: [], children: [] },
    ];
    state.currentAncestors = [];
    const line: string = '- [[leaf]]';
    const level: number = 1;
    const branchText: string = 'root';
    // go
    const result: TreeBuilderState = processLeaf(state, line, level, branchText);
    // assert
    const expdLeafNode: TreeNode = {
      text: 'leaf',
      ancestors: [],
      children: [],
    };
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 1);
    assert.deepStrictEqual(result.nodes[0], expdLeafNode);
    assert.strictEqual(result.petioleMap['leaf'], undefined);
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
    assert.deepStrictEqual(result.updatedNodes, [expdLeafNode]);
  });

  it('update; virtual trunk; exists; with ancestors', () => {
    // setup
    state.isUpdate = true;
    state.options.virtualTrunk = true;
    state.nodes = [
      { text: 'root', ancestors: [], children: [] },
      { text: 'child', ancestors: ['root'], children: [] },
      { text: 'grandchild', ancestors: ['root', 'child'], children: [] },
      { text: 'leaf', ancestors: ['root', 'child', 'grandchild'], children: [] },
    ];
    state.currentAncestors = ['root', 'child', 'grandchild'];
    const line: string = '- [[leaf]]';
    const level: number = 3;
    const branchText: string = 'root';
    // go
    const result: TreeBuilderState = processLeaf(state, line, level, branchText);
    // assert
    const expdLeafNode: TreeNode = {
      text: 'leaf',
      ancestors: ['root', 'child', 'grandchild'],
      children: [],
    };
    assert.strictEqual(result.state, 'PROCESSING_LEAF');
    assert.strictEqual(result.nodes.length, 4);
    assert.deepStrictEqual(result.nodes[3], expdLeafNode);
    assert.strictEqual(result.nodes[2].children.includes('leaf'), true);
    assert.strictEqual(result.petioleMap['leaf'], undefined);
    assert.strictEqual(result.currentAncestors.includes('leaf'), true);
    assert.deepStrictEqual(result.updatedNodes, [expdLeafNode]);
  });

});
