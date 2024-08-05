import assert from 'node:assert/strict';

import { lint } from '../src/index';


describe('lint()', () => {

  it('default', () => {
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
    const actlError: string | void = lint(content);
    // assert
    assert.strictEqual(actlError, expdError);
  });

  // options

  describe('manually set lvlSize', () => {

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

    it('success', () => {
      // setup
      const expdError: undefined = undefined;
      // go
      const actlError: string | void = lint(content, 2);
      // assert
      assert.strictEqual(actlError, expdError);
    });
  
    it('error', () => {
      // setup
      const expdError: string =
`semtree.lint(): improper indentation found:

- File "root" Line 2 (inconsistent indentation): "  - [[grandchild]]"
- File "root" Line 3 (inconsistent indentation): "    - [[greatgrandchild]]"
`;
      // go
      const actlError: string | void = lint(content, 3);
      // assert
      assert.strictEqual(actlError, expdError);
    });

  });

  // indentation

  it('error; improperly indented', () => {
    // setup
    const content: Record<string, string> = {
      'root':
`- [[child]]
  - [[grandchild]]
   - [[greatgrandchild]]
 - [[badindentchild]]
`,
    };
    const expdError: string =
`semtree.lint(): improper indentation found:

- File "root" Line 3 (inconsistent indentation): "   - [[greatgrandchild]]"
- File "root" Line 4 (inconsistent indentation): " - [[badindentchild]]"
`;
    // go
    const actlError: string | void = lint(content);
    // assert
    assert.strictEqual(actlError, expdError);
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
    const expdError: string =
`semtree.lint(): improper indentation found:

- File "root" Line 3 (over-indented): "      - [[overindentgreatgrandchild]]"
`;
    // go
    const actlError: string | void = lint(content);
    // assert
    assert.strictEqual(actlError, expdError);
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
    const expdError: string =
`semtree.lint(): duplicate entity names found:

- File "root" Line 3: "duplicategrandchild"
`;
    // go
    const actlError: string | void = lint(content);
    // assert
    assert.strictEqual(actlError, expdError);
  });

});
