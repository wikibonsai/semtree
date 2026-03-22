import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { extractContent } from '../../src/lib/state';


describe('state 1; extractContent()', () => {

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
      // tree
      root: null,
      nodes: [],
      branches: [],
      petioleMap: {},
      orphanedBranches: [],
      // processing
      level: 0,
      currentAncestors: [],
      isUpdate: false,
      updatedNodes: [],
    };
  });

  it('semtree delimiters', () => {
    // setup
    state.content = {
      'root':
        'Some text before\n'
      + '<!--<semtree>-->\n'
      + '- [[node-1]]\n'
      + '  - [[node-2]]\n'
      + '    - [[node-3]]\n'
      + '  - [[node-4]]\n'
      + '<!--</semtree>-->\n'
      + 'Some text after\n',
    };
    // go
    const result: TreeBuilderState = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root':
        '- [[node-1]]\n'
      + '  - [[node-2]]\n'
      + '    - [[node-3]]\n'
      + '  - [[node-4]]'
    });
    // 2 lines before content: "Some text before" + "<!--<semtree>-->"
    assert.deepStrictEqual(result.lineOffsets, { 'root': 2 });
  });

  it('yaml', () => {
    // setup
    state.content = {
      'root':
        '---\n'
      + 'title: Test Document\n'
      + 'date: 2023-04-01\n'
      + '---\n'
      + '\n'
      + '- [[node-1]]\n'
      + '  - [[node-2]]\n',
    };
    // go
    const result: TreeBuilderState = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root':
        '- [[node-1]]\n'
      + '  - [[node-2]]',
    });
    // 4 yaml lines (---, title, date, ---) + 1 blank = 5
    assert.deepStrictEqual(result.lineOffsets, { 'root': 5 });
  });

  it('caml', () => {
    // setup
    state.content = {
      'root':
        ': title :: Test Document\n'
      + ': date :: 2023-04-01\n'
      + '\n'
      + '- [[node-1]]\n'
      + '  - [[node-2]]\n',
    };
    // go
    const result: TreeBuilderState = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root':
        '- [[node-1]]\n'
      + '  - [[node-2]]',
    });
    // 2 caml attr lines + 1 blank = 3
    assert.deepStrictEqual(result.lineOffsets, { 'root': 3 });
  });

  it('caml + wikiattr', () => {
    // setup
    state.content = {
      'root':
        ': title :: Test Document\n'
      + ': date  :: 2023-04-01\n'
      + ': comma :: thing1, thing2, thing3\n'
      + ': list  :: \n'
      + '           - thing1\n'
      + '           - thing2\n'
      + '           - thing3\n'
      + ': synonym :: [[link]]\n'
      + ': antonym :: \n'
      + '            - [[link1]]\n'
      + '            - [[link2]]\n'
      + ': tag     :: [[tag1]], [[tag2]], [[tag3]]\n'
      + '\n'
      + '- [[node-1]]\n'
      + '  - [[node-2]]\n',
    };
    // go
    const result: TreeBuilderState = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root':
        '- [[node-1]]\n'
      + '  - [[node-2]]',
    });
    // 12 attr lines + 1 blank = 13
    assert.deepStrictEqual(result.lineOffsets, { 'root': 13 });
  });

  it('yaml + caml + blank lines', () => {
    // setup
    state.content = {
      'root':
        '---\n'                                          // 1
      + 'title: Test Document\n'                         // 2
      + '---\n'                                          // 3
      + '\n'                                             // 4
      + ': date  :: 2023-04-01\n'                        // 5
      + ': comma :: thing1, thing2, thing3\n'            // 6
      + ': list  :: \n'                                  // 7
      + '           - thing1\n'                          // 8
      + '           - thing2\n'                          // 9
      + '           - thing3\n'                          // 10
      + ': synonym :: [[link]]\n'                        // 11
      + ': antonym :: \n'                                // 12
      + '            - [[link1]]\n'                      // 13
      + '            - [[link2]]\n'                      // 14
      + ': tag     :: [[tag1]], [[tag2]], [[tag3]]\n'    // 15
      + '\n'                                             // 16
      + '- [[node-1]]\n'                                 // 17
      + '  - [[node-2]]\n',                              // 18
    };
    // go
    const result: TreeBuilderState = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root':
        '- [[node-1]]\n'
      + '  - [[node-2]]',
    });
    // 3 yaml + 1 blank + 11 caml + 1 blank = 16
    assert.deepStrictEqual(result.lineOffsets, { 'root': 16 });
  });

  it('delimiter; markdown, yaml, caml', () => {
    // setup
    state.content = {
      'root':
        '# Header\n'                                    // 1
      + '\n'                                             // 2
      + 'title: Test Document\n'                         // 3
      + '---\n'                                          // 4
      + '\n'                                             // 5
      + 'Some paragraph text.\n'                         // 6
      + '\n'                                             // 7
      + ': date :: 2023-04-01\n'                         // 8
      + '\n'                                             // 9
      + '<!--<semtree>-->\n'                             // 10
      + '- [[node-1]]\n'                                 // 11
      + '  - [[node-2]]\n'                               // 12
      + '<!--</semtree>-->\n'                            // 13
      + '\n'                                             // 14
      + 'More markdown content.\n',                      // 15
    };
    // go
    const result: TreeBuilderState = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root':
        '- [[node-1]]\n'
      + '  - [[node-2]]',
    });
    // 9 lines before delimiter + 1 delimiter line = 10
    assert.deepStrictEqual(result.lineOffsets, { 'root': 10 });

  });

});
