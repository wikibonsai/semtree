import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { validateContent } from '../../src/lib/state';


describe('state 3; validateContent()', () => {

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
      'root':
        '- [[node-1]]\n'
      + '  - [[node-2]]\n'
      + '- [[node-3]]\n',
    };
    // go
    const result: TreeBuilderState = validateContent(state);
    // assert
    assert.strictEqual(result.state, 'VALIDATING_CONTENT');
  });

  it('error', () => {
    // setup
    state.content = {
      'root':
        '- [[node-1]]\n'
      + '- [[node-2]]\n'
      + '    - [[node-3]]',
    };
    // go and assert
    assert.throws(() => validateContent(state), Error);
  });

  it('error with lineOffsets — adjusted line numbers in error message', () => {
    // setup
    state.content = {
      'root':
        '- [[node-1]]\n'
      + '- [[node-2]]\n'
      + '    - [[node-3]]',
    };
    state.lineOffsets = { 'root': 5 };
    // go and assert — error message should contain adjusted line number (3 + 5 = 8)
    assert.throws(
      () => validateContent(state),
      (err: Error) => {
        assert.ok(err.message.includes('Line 8'), `Expected "Line 8" in error message, got: ${err.message}`);
        assert.ok(!err.message.includes('Line 3'), `Should not contain unadjusted "Line 3", got: ${err.message}`);
        return true;
      },
    );
  });

});
