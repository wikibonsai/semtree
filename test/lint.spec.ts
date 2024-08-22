import assert from 'node:assert/strict';

import type { LintOpts } from '../src/lib/types';
import { lint } from '../src/index';


describe('lint()', () => {

  let opts: LintOpts;
  
  beforeEach(() => {
    opts = {
      indentKind: 'space',
      indentSize: 2,
      mkdnBullet: true,
      wikiLink: true,
      root: 'root',
    };
  });

  it('default success -- no errors', () => {
    // setup
    const content: Record<string, string> = {
      'root':
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '    - [[greatgrandchild]]\n',
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
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '    - [[greatgrandchild]]\n',
      'unused-trunk-file':
        '- [[another-child]]\n'
      + '  - [[another-grandchild]]\n'
      + '    - [[another-greatgrandchild]]\n',
    };
    const expdResult = {
      warn: 'semtree.lint(): orphan trunk files found:\n'
      + '\n'
      + '- unused-trunk-file\n',
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
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '    - [[greatgrandchild]]\n',
      'unused-trunk-file':
        '- [[another-child]]\n'
      + '  - [[another-grandchild]]\n'
      + '    - [[another-greatgrandchild]]\n',
    };
    const expdResult = {
      warn: 'semtree.lint(): orphan trunk files found:\n'
      + '\n'
      + '- unused-trunk-file\n',
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
        '- [[child]]\n'
      + '  - [[duplicategrandchild]]\n'
      + '  - [[duplicategrandchild]]\n',
    };
    const expdResult = {
      warn: '',
      error: 'semtree.lint(): duplicate entity names found:\n'
      + '\n'
      + '- "duplicategrandchild"\n'
      + '  - File "root" Line 2\n'
      + '  - File "root" Line 3\n',
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
        '- [[child]]\n'
      + '  - [[duplicategrandchild]]\n',
      'another-file':
        '- [[anotherchild]]\n'
      + '  - [[duplicategrandchild]]\n'
      + '  - [[anotherduplicate]]\n',
      'third-file':
        '- [[thirdchild]]\n'
      + '  - [[anotherduplicate]]\n',
    };
    const expdResult = {
      warn: 'semtree.lint(): orphan trunk files found:\n'
      + '\n'
      + '- another-file\n'
      + '- third-file\n',
      error: 'semtree.lint(): duplicate entity names found:\n'
      + '\n'
      + '- "duplicategrandchild"\n'
      + '  - File "root" Line 2\n'
      + '  - File "another-file" Line 2\n'
      + '- "anotherduplicate"\n'
      + '  - File "another-file" Line 3\n'
      + '  - File "third-file" Line 2\n',
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
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '   - [[greatgrandchild]]\n'
      + ' - [[badindentchild]]\n',
    };
    const expdResult = {
      warn: '',
      error: 'semtree.lint(): improper indentation found:\n'
      + '\n'
      + '- File "root" Line 3 (inconsistent indentation): "   - [[greatgrandchild]]"\n'
      + '- File "root" Line 4 (inconsistent indentation): " - [[badindentchild]]"\n',
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
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '      - [[overindentgreatgrandchild]]\n'
      + ' - [[badindentchild]]\n',
    };
    const expdResult = {
      warn: '',
      error: 'semtree.lint(): improper indentation found:\n'
      + '\n'
      + '- File "root" Line 3 (over-indented): "      - [[overindentgreatgrandchild]]"\n'
      + '- File "root" Line 4 (inconsistent indentation): " - [[badindentchild]]"\n',
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
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '    - [[greatgrandchild]]\n',
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
          '- [[child]]\n'
        + '\t\t- [[grandchild]]\n'
        + '\t\t\t\t- [[greatgrandchild]]\n',
      };
      const expdError = {
        warn: '',
        error:
          'semtree.lint(): improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (tabs found): "\t\t- [[grandchild]]"\n'
        + '- File "root" Line 3 (tabs found): "\t\t\t\t- [[greatgrandchild]]"\n',
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
          '- [[child]]\n'
        + '\t\t- [[grandchild]]\n'
        + '\t\t\t\t- [[greatgrandchild]]\n',
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
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '    - [[greatgrandchild]]\n',
      };
      const expdError = {
        warn: '',
        error:
          'semtree.lint(): improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (spaces found): "  - [[grandchild]]"\n'
        + '- File "root" Line 3 (spaces found): "    - [[greatgrandchild]]"\n',
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
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '    - [[greatgrandchild]]\n',
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
          '- [[child]]\n'
        + '   - [[grandchild]]\n'
        + '      - [[greatgrandchild]]\n',
      };
      const expdResult = {
        warn: '',
        error: 'semtree.lint(): improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (inconsistent indentation): "   - [[grandchild]]"\n'
        + '- File "root" Line 3 (over-indented): "      - [[greatgrandchild]]"\n',
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
          '- [[child]]\n'
        + '   - [[grandchild]]\n'
        + '      - [[greatgrandchild]]\n',
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
        error: 'semtree.lint(): improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (inconsistent indentation): "  - [[grandchild]]"\n'
        + '- File "root" Line 3 (inconsistent indentation): "    - [[greatgrandchild]]"\n',
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
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '  + [[grandchild2]]\n'
        + '  * [[grandchild3]]\n',
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
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '  [[grandchild2]]\n',
      };
      const expdResult = {
        warn: 'semtree.lint(): missing markdown bullet found:\n'
        + '\n'
        + '- File "root" Line 3: "  [[grandchild2]]"\n',
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
          '[[child]]\n'
        + '  [[grandchild]]\n'
        + '    [[greatgrandchild]]\n',
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, mkdnBullet: false });
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect no bullet', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '[[child]]\n'
        + '  [[grandchild]]\n'
        + '  - [[grandchild2]]\n',
      };
      const expdResult = {
        warn: 'semtree.lint(): unexpected markdown bullet found:\n'
        + '\n'
        + '- File "root" Line 3: "  - [[grandchild2]]"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, mkdnBullet: false });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

  });

  describe('opt; wikilink', () => {

    it('success; expect has wikilink', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '    - [[greatgrandchild]]\n',
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect has wikilink', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '  - grandchild2\n',
      };
      const expdResult = {
        warn: 'semtree.lint(): missing wikilink found:\n'
        + '\n'
        + '- File "root" Line 3: "  - grandchild2"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, opts);
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('success; expect no wikilink', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- child\n'
        + '  - grandchild\n'
        + '    - greatgrandchild\n',
      };
      // no error
      const expdResult: undefined = undefined;
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, wikiLink: false });
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect no wikilink', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- child\n'
        + '  - grandchild\n'
        + '  - [[grandchild2]]\n',
      };
      const expdResult = {
        warn: 'semtree.lint(): unexpected wikilink found:\n'
        + '\n'
        + '- File "root" Line 3: "  - [[grandchild2]]"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = lint(content, { ...opts, wikiLink: false });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

  });

});