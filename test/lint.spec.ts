import assert from 'node:assert/strict';

import type { LintOpts } from '../src/lib/types';
import { lint } from '../src/index';


describe('lint()', () => {

  let opts: LintOpts;
  
  beforeEach(() => {
    opts = {
      indentKind: 'space',
      indentSize: 2,
      mkdnList: true,
      wikitext: true,
      root: 'root',
    };
  });

  it('default success -- no errors', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
    };
    // no error
    const expdResult: undefined = undefined;
    // go
    const actlResult: void | { warn: string; error: string; } = lint(content, opts);
    // assert
    assert.strictEqual(actlResult, expdResult);
  });

  // orphan trunk files

  it('warn; orphan trunk files', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
      'unused-trunk-file':
`- [[another-child]]
  - [[another-grandchild]]
    - [[another-greatgrandchild]]
`,
    };
    const expdResult = {
      warn: `semtree.lint(): orphan trunk files found:

- unused-trunk-file
`,
      error: '',
    };
    // go
    const actlResult: void | { warn: string; error: string; } = lint(content, opts);
    // assert
    assert.deepStrictEqual(actlResult, expdResult);
  });

  it('warn; orphan trunk files with duplicates (duplicates removed from error string)', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
      'unused-trunk-file':
`- [[another-child]]
  - [[another-grandchild]]
    - [[another-greatgrandchild]]
`,
    };
    const expdResult = {
      warn: `semtree.lint(): orphan trunk files found:

- unused-trunk-file
`,
      error: '',
    };
    // go
    const actlResult: void | { warn: string; error: string; } = lint(content, opts);
    // assert
    assert.deepStrictEqual(actlResult, expdResult);
  });

  // duplicates

  it('error; duplicates found', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[duplicategrandchild]]
  - [[duplicategrandchild]]
`,
    };
    const expdResult = {
      warn: '',
      error: `semtree.lint(): duplicate entity names found:

- "duplicategrandchild"
  - File "root" Line 2
  - File "root" Line 3
`,
    };
    // go
    const actlResult: void | { warn: string; error: string; } = lint(content, opts);
    // assert
    assert.deepStrictEqual(actlResult, expdResult);
  });

  it('error; multiple duplicates across files', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[duplicategrandchild]]
`,
      'another-file':
`- [[anotherchild]]
  - [[duplicategrandchild]]
  - [[anotherduplicate]]
`,
      'third-file':
`- [[thirdchild]]
  - [[anotherduplicate]]
`,
    };
    const expdResult = {
      warn: `semtree.lint(): orphan trunk files found:

- another-file
- third-file
`,
      error: `semtree.lint(): duplicate entity names found:

- "duplicategrandchild"
  - File "root" Line 2
  - File "another-file" Line 2
- "anotherduplicate"
  - File "another-file" Line 3
  - File "third-file" Line 2
`,
    };
    // go
    const actlResult: void | { warn: string; error: string; } = lint(content, opts);
    // assert
    assert.deepStrictEqual(actlResult, expdResult);
  });

  // indentation

  it('error; inconsistent indentation', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[grandchild]]
   - [[greatgrandchild]]
 - [[badindentchild]]
`,
    };
    const expdResult = {
      warn: '',
      error: `semtree.lint(): improper indentation found:

- File "root" Line 3 (inconsistent indentation): "   - [[greatgrandchild]]"
- File "root" Line 4 (inconsistent indentation): " - [[badindentchild]]"
`,
    };
    // go
    const actlResult: void | { warn: string; error: string; } = lint(content, opts);
    // assert
    assert.deepStrictEqual(actlResult, expdResult);
  });

  it('error; over-indented', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[grandchild]]
      - [[overindentgreatgrandchild]]
    - [[badindentchild]]
`,
    };
    const expdResult = {
      warn: '',
      error: `semtree.lint(): improper indentation found:

- File "root" Line 3 (over-indented): "      - [[overindentgreatgrandchild]]"
`,
    };
    // go
    const actlResult: void | { warn: string; error: string; } = lint(content, opts);
    // assert
    assert.deepStrictEqual(actlResult, expdResult);
  });

  // options

  describe('opt; indentKind', () => {

    it('success; expect space, has space', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
      };
      // no error
      const expdError: undefined = undefined;
      // go
      const actlError: void | { warn: string; error: string; } = lint(content, { ...opts, indentKind: 'space' });
      // assert
      assert.strictEqual(actlError, expdError);
    });

    it('error; expect space, has tab', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
\t\t- [[grandchild]]
\t\t\t\t- [[greatgrandchild]]
`,
      };
      const expdError = {
        warn: '',
        error:
`semtree.lint(): improper indentation found:

- File "root" Line 2 (tabs found): "\t\t- [[grandchild]]"
- File "root" Line 3 (tabs found): "\t\t\t\t- [[greatgrandchild]]"
`,
      };
      // go
      const actlError: void | { warn: string; error: string; } = lint(content, { ...opts, indentKind: 'space' });
      // assert
      assert.deepStrictEqual(actlError, expdError);
    });

    it('success; expect tab, has tab', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
\t\t- [[grandchild]]
\t\t\t\t- [[greatgrandchild]]
`,
      };
      // no error
      const expdError: undefined = undefined;
      // go
      const actlError: void | { warn: string; error: string; } = lint(content, { ...opts, indentKind: 'tab' });
      // assert
      assert.strictEqual(actlError, expdError);
    });

    it('error; expect tab, has space', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
      };
      const expdError = {
        warn: '',
        error:
`semtree.lint(): improper indentation found:

- File "root" Line 2 (spaces found): "  - [[grandchild]]"
- File "root" Line 3 (spaces found): "    - [[greatgrandchild]]"
`,
      };
      // go
      const actlError: void | { warn: string; error: string; } = lint(content, { ...opts, indentKind: 'tab' });
      // assert
      assert.deepStrictEqual(actlError, expdError);
    });

  });

  describe('opt; indentSize', () => {

    let content: Record<string, string>;

    beforeEach(() => {
      content = {
        'root':
`- [[child]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
      };
    });

    it('success; expect 2', () => {
      // setup
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect 2, has 3 (note how inconsistent indentation can mess with the indentation later on)', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
   - [[grandchild]]
      - [[greatgrandchild]]
`,
      };
      const expdResult = {
        warn: '',
        error: `semtree.lint(): improper indentation found:

- File "root" Line 2 (inconsistent indentation): "   - [[grandchild]]"
- File "root" Line 3 (over-indented): "      - [[greatgrandchild]]"
`,
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('success; expect 3', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
   - [[grandchild]]
      - [[greatgrandchild]]
`,
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, indentSize: 3 });
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect 3, has 2', () => {
      // setup
      const expdResult = {
        warn: '',
        error: `semtree.lint(): improper indentation found:

- File "root" Line 2 (inconsistent indentation): "  - [[grandchild]]"
- File "root" Line 3 (inconsistent indentation): "    - [[greatgrandchild]]"
`,
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, indentSize: 3 });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });
  });

  describe('opt; mkdnBullet', () => {

    it('success; expect has bullet', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
  - [[grandchild]]
  + [[grandchild2]]
  * [[grandchild3]]
`,
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect has bullet', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
  - [[grandchild]]
  [[grandchild2]]
`,
      };
      const expdResult = {
        warn: `semtree.lint(): missing markdown bullet found:

- File "root" Line 3: "  [[grandchild2]]"
`,
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('success; expect no bullet', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`[[child]]
  [[grandchild]]
    [[greatgrandchild]]
`,
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, mkdnList: false });
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect no bullet', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`[[child]]
  [[grandchild]]
  - [[grandchild2]]
`,
      };
      const expdResult = {
        warn: `semtree.lint(): unexpected markdown bullet found:

- File "root" Line 3: "  - [[grandchild2]]"
`,
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, mkdnList: false });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

  });

  describe('opt; wikitext', () => {

    it('success; expect has wikitext', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect has wikitext', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- [[child]]
  - [[grandchild]]
  - grandchild2
`,
      };
      const expdResult = {
        warn: `semtree.lint(): missing wikitext found:

- File "root" Line 3: "  - grandchild2"
`,
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('success; expect no wikitext', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- child
  - grandchild
    - greatgrandchild
`,
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, wikitext: false });
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect no wikitext', () => {
      // setup
      const content: Record<string, string> = {
        'root':
`- child
  - grandchild
  - [[grandchild2]]
`,
      };
      const expdResult = {
        warn: `semtree.lint(): unexpected wikitext found:

- File "root" Line 3: "  - [[grandchild2]]"
`,
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, wikitext: false });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

  });

});