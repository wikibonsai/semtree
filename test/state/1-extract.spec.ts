import assert from 'node:assert/strict';

import type { TreeBuilderState, SemTreeOpts } from '../../src/lib/types';
import { extractContent } from '../../src/lib/state';


describe('state 1; extractContent()', () => {

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
      state: 'INITIAL',
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
  });

  it('yaml + caml + blank lines', () => {
    // setup
    state.content = {
      'root':
        '---\n'
      + 'title: Test Document\n'
      + '---\n'
      + '\n'
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
  });

  it('delimiter; markdown, yaml, caml', () => {
    // setup
    state.content = {
      'root':
        '# Header\n'
      + '\n'
      + 'title: Test Document\n'
      + '---\n'
      + '\n'
      + 'Some paragraph text.\n'
      + '\n'
      + ': date :: 2023-04-01\n'
      + '\n'
      + '<!--<semtree>-->\n'
      + '- [[node-1]]\n'
      + '  - [[node-2]]\n'
      + '<!--</semtree>-->\n'
      + '\n'
      + 'More markdown content.\n',
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

  });

});
