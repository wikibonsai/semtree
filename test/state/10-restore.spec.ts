import assert from 'node:assert/strict';
import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { restoreState } from '../../src/lib/state';


describe('state 10; restoreState()', () => {
  let opts: SemTreeOpts;
  let state: TreeBuilderState;

  beforeEach(() => {
    opts = {
      virtualTrunk: false,
      delimiter: 'semtree',
      indentKind: 'space',
      indentSize: 2,
      mkdnBullet: true,
      wikiLink: true,
    };
    state = {
      state: 'PROCESSING_ROOT',
      opts: opts,
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
      originalState: {
        root: 'root',
        nodes: [
          { text: 'root', ancestors: [], children: [] },
          { text: 'child', ancestors: ['root'], children: [] },
        ],
        trunk: ['root'],
        petioleMap: { 'root': 'root', 'child': 'root' },
        orphans: [],
      }
    };
  });

  it('restores the original state', () => {
    // setup
    state.nodes[0].children.push('newChild');
    state.nodes.push({ text: 'newChild', ancestors: ['root'], children: [] });
    state.trunk.push('newChild');
    state.petioleMap['newChild'] = 'root';
    // go
    const result: TreeBuilderState = restoreState(state);
    // assert
    assert.strictEqual(result.state, 'RESTORING_STATE');
    assert.deepStrictEqual(result.nodes, state.originalState!.nodes);
    assert.deepStrictEqual(result.trunk, state.originalState!.trunk);
    assert.deepStrictEqual(result.petioleMap, state.originalState!.petioleMap);
    assert.deepStrictEqual(result.orphans, state.originalState!.orphans);
    assert.deepStrictEqual(result.originalState, state.originalState);
  });

});
