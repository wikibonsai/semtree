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
      'root': [
        'Some text before',
        '<!--<semtree>-->',
        '- [[node-1]]',
        '  - [[node-2]]',
        '    - [[node-3]]',
        '  - [[node-4]]',
        '<!--</semtree>-->',
        'Some text after',
      ],
    };
    // go
    const result = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root': [
        '- [[node-1]]',
        '  - [[node-2]]',
        '    - [[node-3]]',
        '  - [[node-4]]',
      ],
    });
  });

  it('yaml', () => {
    // setup
    state.content = {
      'root': [
        '---',
        'title: Test Document',
        'date: 2023-04-01',
        '---',
        '',
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    };
    // go
    const result = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root': [
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    });
  });

  it('caml', () => {
    // setup
    state.content = {
      'root': [
        ': title :: Test Document',
        ': date :: 2023-04-01',
        '',
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    };
    // go
    const result = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root': [
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    });
  });

  it('caml + wikiattr', () => {
    // setup
    state.content = {
      'root': [
        ': title :: Test Document',
        ': date  :: 2023-04-01',
        ': comma :: thing1, thing2, thing3',
        ': list  :: ',
        '           - thing1',
        '           - thing2',
        '           - thing3',
        ': synonym :: [[link]]',
        ': antonym :: ',
        '            - [[link1]]',
        '            - [[link2]]',
        ': tag     :: [[tag1]], [[tag2]], [[tag3]]',
        '',
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    };
    // go
    const result = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root': [
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    });
  });

  it('yaml + caml + blank lines', () => {
    // setup
    state.content = {
      'root': [
        '---',
        'title: Test Document',
        '---',
        ': date  :: 2023-04-01',
        ': comma :: thing1, thing2, thing3',
        ': list  :: ',
        '           - thing1',
        '           - thing2',
        '           - thing3',
        ': synonym :: [[link]]',
        ': antonym :: ',
        '            - [[link1]]',
        '            - [[link2]]',
        ': tag     :: [[tag1]], [[tag2]], [[tag3]]',
        '',
        '',
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    };
    // go
    const result = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root': [
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    });
  });

  it('delimiter; markdown, yaml, caml', () => {
    // setup
    state.content = {
      'root': [
        '# Header',
        '',
        '---',
        'title: Test Document',
        '---',
        '',
        'Some paragraph text.',
        '',
        ': date :: 2023-04-01',
        '',
        '<!--<semtree>-->',
        '- [[node-1]]',
        '  - [[node-2]]',
        '<!--</semtree>-->',
        '',
        'More markdown content.',
      ],
    };
    // go
    const result = extractContent(state);
    // assert
    assert.strictEqual(result.state, 'EXTRACTING_CONTENT');
    assert.deepStrictEqual(result.content, {
      'root': [
        '- [[node-1]]',
        '  - [[node-2]]',
      ],
    });

  });

});
