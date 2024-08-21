import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { lintContent } from '../../src/lib/state';


describe('state 3; lintContent()', () => {

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
      state: 'PROCESSING_ROOT',
      opts: opts,
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

  it('success', () => {
    // setup
    state.content = {
      'root': [
        '- [[node-1]]',
        '  - [[node-2]]',
        '- [[node-3]]',
      ],
    };
    // go
    const result = lintContent(state);
    // assert
    assert.strictEqual(result.state, 'LINTING_CONTENT');
  });

  it('error', () => {
    // setup
    state.content = {
      'root': [
        '- [[node-1]]',
        '- [[node-2]]',
        '    - [[node-3]]'], // over-indented
    };
    // go and assert
    assert.throws(() => lintContent(state), Error);
  });

});