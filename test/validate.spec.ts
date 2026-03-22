import assert from 'node:assert/strict';

import type { ValidateOpts } from '../src/lib/types';
import { validate } from '../src/index';


describe('validate()', () => {

  let opts: ValidateOpts;

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
    const actlResult: void | { warn: string; error: string; } = validate(content, opts);
    // assert
    assert.strictEqual(actlResult, expdResult);
  });

  // orphaned branch files

  it('warn; orphaned branch files', () => {
    // setup
    const content: Record<string, string> = {
      'root':
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '    - [[greatgrandchild]]\n',
      'unused-branch-file':
        '- [[another-child]]\n'
      + '  - [[another-grandchild]]\n'
      + '    - [[another-greatgrandchild]]\n',
    };
    const expdResult = {
      warn: 'orphaned branch files found:\n'
      + '\n'
      + '- unused-branch-file\n',
      error: '',
    };
    // go
    const actlResult: void | { warn: string; error: string; } = validate(content, opts);
    // assert
    assert.deepStrictEqual(actlResult, expdResult);
  });

  it('warn; orphaned branch files with duplicates (duplicates removed from error string)', () => {
    // setup
    const content: Record<string, string> = {
      'root':
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '    - [[greatgrandchild]]\n',
      'unused-branch-file':
        '- [[another-child]]\n'
      + '  - [[another-grandchild]]\n'
      + '    - [[another-greatgrandchild]]\n',
    };
    const expdResult = {
      warn: 'orphaned branch files found:\n'
      + '\n'
      + '- unused-branch-file\n',
      error: '',
    };
    // go
    const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      error: 'duplicate entity names found:\n'
      + '\n'
      + '- File "root"\n'
      + '  - "duplicategrandchild" found on lines: 2, 3\n'
    };
    // go
    const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      warn: 'orphaned branch files found:\n'
      + '\n'
      + '- another-file\n'
      + '- third-file\n',
      error: 'duplicate entity names found:\n'
      + '\n'
      + '- File "root"\n'
      + '  - "duplicategrandchild" found on line: 2\n'
      + '- File "another-file"\n'
      + '  - "duplicategrandchild" found on line: 2\n'
      + '  - "anotherduplicate" found on line: 3\n'
      + '- File "third-file"\n'
      + '  - "anotherduplicate" found on line: 2\n',
    };
    // go
    const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      error: 'improper indentation found:\n'
      + '\n'
      + '- File "root" Line 3 (inconsistent indentation): "   - [[greatgrandchild]]"\n'
      + '- File "root" Line 4 (inconsistent indentation): " - [[badindentchild]]"\n',
    };
    // go
    const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      error: 'improper indentation found:\n'
      + '\n'
      + '- File "root" Line 3 (over-indented): "      - [[overindentgreatgrandchild]]"\n'
      + '- File "root" Line 4 (inconsistent indentation): " - [[badindentchild]]"\n',
    };
    // go
    const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      const actlError: void | { warn: string; error: string; } = validate(content, { ...opts, indentKind: 'space' });
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
          'improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (tabs found): "\t\t- [[grandchild]]"\n'
        + '- File "root" Line 3 (tabs found): "\t\t\t\t- [[greatgrandchild]]"\n',
      };
      // go
      const actlError: void | { warn: string; error: string; } = validate(content, { ...opts, indentKind: 'space' });
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
      const actlError: void | { warn: string; error: string; } = validate(content, { ...opts, indentKind: 'tab' });
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
          'improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (spaces found): "  - [[grandchild]]"\n'
        + '- File "root" Line 3 (spaces found): "    - [[greatgrandchild]]"\n',
      };
      // go
      const actlError: void | { warn: string; error: string; } = validate(content, { ...opts, indentKind: 'tab' });
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
      const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
        error: 'improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (inconsistent indentation): "   - [[grandchild]]"\n'
        + '- File "root" Line 3 (over-indented): "      - [[greatgrandchild]]"\n',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, indentSize: 3 });
      // assert
      assert.strictEqual(actlResult, expdResult);
    });

    it('error; expect 3, has 2', () => {
      // setup
      const expdResult = {
        warn: '',
        error: 'improper indentation found:\n'
        + '\n'
        + '- File "root" Line 2 (inconsistent indentation): "  - [[grandchild]]"\n'
        + '- File "root" Line 3 (inconsistent indentation): "    - [[greatgrandchild]]"\n',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, indentSize: 3 });
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
      const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
        warn: 'missing markdown bullet found:\n'
        + '\n'
        + '- File "root" Line 3: "  [[grandchild2]]"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, mkdnBullet: false });
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
        warn: 'unexpected markdown bullet found:\n'
        + '\n'
        + '- File "root" Line 3: "  - [[grandchild2]]"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, mkdnBullet: false });
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
      const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
        warn: 'missing wikilink found:\n'
        + '\n'
        + '- File "root" Line 3: "  - grandchild2"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, opts);
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
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, wikiLink: false });
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
        warn: 'unexpected wikilink found:\n'
        + '\n'
        + '- File "root" Line 3: "  - [[grandchild2]]"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, wikiLink: false });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

  });

  describe('opt; lineOffsets', () => {

    it('error; indentation error with offset (yaml has 4 header lines, error on extracted line 3 → reported as line 7)', () => {
      // setup — content is already extracted, offset represents the 4 yaml lines + 1 blank stripped
      const content: Record<string, string> = {
        'root':
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '      - [[overindented]]\n',
      };
      const lineOffsets: Record<string, number> = { 'root': 4 };
      const expdResult = {
        warn: '',
        error: 'improper indentation found:\n'
        + '\n'
        + '- File "root" Line 7 (over-indented): "      - [[overindented]]"\n',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, lineOffsets });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('error; duplicate error with offset (caml has 2 attr lines + blank, duplicates on extracted lines 2,3 → reported as lines 5,6)', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- [[child]]\n'
        + '  - [[dupchild]]\n'
        + '  - [[dupchild]]\n',
      };
      const lineOffsets: Record<string, number> = { 'root': 3 };
      const expdResult = {
        warn: '',
        error: 'duplicate entity names found:\n'
        + '\n'
        + '- File "root"\n'
        + '  - "dupchild" found on lines: 5, 6\n',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, lineOffsets });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('warn; markdown bullet warning with offset', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '  [[nobullet]]\n',
      };
      const lineOffsets: Record<string, number> = { 'root': 5 };
      const expdResult = {
        warn: 'missing markdown bullet found:\n'
        + '\n'
        + '- File "root" Line 8: "  [[nobullet]]"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, lineOffsets });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('warn; wikilink warning with offset', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '  - nowikilink\n',
      };
      const lineOffsets: Record<string, number> = { 'root': 5 };
      const expdResult = {
        warn: 'missing wikilink found:\n'
        + '\n'
        + '- File "root" Line 8: "  - nowikilink"\n',
        error: '',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, lineOffsets });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('single-file string with offset (empty-string key)', () => {
      // setup
      const content: string =
        '- [[child]]\n'
      + '  - [[grandchild]]\n'
      + '      - [[overindented]]\n';
      const lineOffsets: Record<string, number> = { '': 4 };
      const expdResult = {
        warn: '',
        error: 'improper indentation found:\n'
        + '\n'
        + '- Line 7 (over-indented): "      - [[overindented]]"\n',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, lineOffsets });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

    it('multi-file with different offsets', () => {
      // setup
      const content: Record<string, string> = {
        'root':
          '- [[child]]\n'
        + '  - [[grandchild]]\n'
        + '      - [[overindented]]\n',
        'branch':
          '- [[leaf]]\n'
        + '  - [[dup]]\n'
        + '  - [[dup]]\n',
      };
      const lineOffsets: Record<string, number> = { 'root': 4, 'branch': 2 };
      const expdResult = {
        warn: 'orphaned branch files found:\n'
        + '\n'
        + '- branch\n',
        error: 'duplicate entity names found:\n'
        + '\n'
        + '- File "branch"\n'
        + '  - "dup" found on lines: 4, 5\n'
        + 'improper indentation found:\n'
        + '\n'
        + '- File "root" Line 7 (over-indented): "      - [[overindented]]"\n',
      };
      // go
      const actlResult: void | { warn: string; error: string; } = validate(content, { ...opts, lineOffsets });
      // assert
      assert.deepStrictEqual(actlResult, expdResult);
    });

  });

});
