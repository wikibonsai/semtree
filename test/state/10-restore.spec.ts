
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

  it('default', () => {
    // go
    const result = restoreState(state);
    // assert
    assert.strictEqual(0, 1);
  });

});
