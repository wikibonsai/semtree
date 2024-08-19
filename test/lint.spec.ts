import assert from 'node:assert/strict';

import type { SemTreeOpts } from '../src/lib/types';
import { lint } from '../src/index';


describe('lint()', () => {

  let opts: SemTreeOpts;
  
  beforeEach(() => {
    opts = {
      indentSize: 2,
      mkdnList: true,
      wikitext: true,
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
    const expdError: undefined = undefined;
    // go
    const actlError: string | void = lint(content, opts);
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
    const actlError: string | void = lint(content, opts);
    // assert
    assert.strictEqual(actlError, expdError);
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
    const expdError: string =
`semtree.lint(): improper indentation found:

- File "root" Line 3 (inconsistent indentation): "   - [[greatgrandchild]]"
- File "root" Line 4 (inconsistent indentation): " - [[badindentchild]]"
`;
    // go
    const actlError: string | void = lint(content, opts);
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
    const actlError: string | void = lint(content, opts);
    // assert
    assert.strictEqual(actlError, expdError);
  });

  // options

//   describe('opt; indentKind', () => {

//     it('success; space', () => {
//       // setup
//       const content: Record<string, string> = {
//         'root':
// `- [[child]]
//   - [[grandchild]]
//     - [[greatgrandchild]]
// `,
//       };
//       // no error
//       const expdError: undefined = undefined;
//       // go
//       const actlError: string | void = lint(content, { ...opts, indentKind: 'space' });
//       // assert
//       assert.strictEqual(actlError, expdError);
//     });

//     it('error; space', () => {
//       // setup
//       const content: Record<string, string> = {
//         'root':
// `- [[child]]
//  - [[grandchild]]
//    - [[greatgrandchild]]
// `,
//       };
//       const expdError: string =
// `semtree.lint(): improper indentation found:

// - File "root" Line 2 (inconsistent indentation): " - [[grandchild]]"
// - File "root" Line 3 (inconsistent indentation): "   - [[greatgrandchild]]"
// `;
//       // go
//       const actlError: string | void = lint(content, { ...opts, indentKind: 'space' });
//       // assert
//       assert.strictEqual(actlError, expdError);
//     });

//     it('success; tab', () => {
//       // setup
//       const content: Record<string, string> = {
//         'root':
// `- [[child]]
// \t\t- [[grandchild]]
// \t\t\t\t- [[greatgrandchild]]
// `,
//       };
//       // no error
//       const expdError: undefined = undefined;
//       // go
//       const actlError: string | void = lint(content, { ...opts, indentKind: 'tab' });
//       // assert
//       assert.strictEqual(actlError, expdError);
//     });

//     it('error; tab', () => {
//       // setup
//       const content: Record<string, string> = {
//         'root':
// `- [[child]]
// \t\t- [[grandchild]]
// \t\t\t\t- [[greatgrandchild]]
// `,
//       };
//       const expdError: string =
// `semtree.lint(): improper indentation found:

// - File "root" Line 3 (inconsistent indentation): "\t \t- [[greatgrandchild]]"
// `;
//       // go
//       const actlError: string | void = lint(content, { ...opts, indentKind: 'tab' });
//       // assert
//       assert.strictEqual(actlError, expdError);
//     });
// 
//   });

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
      const expdError: undefined = undefined;
      // go
      const actlError: string | void = lint(content, opts);
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: string =
`semtree.lint(): improper indentation found:

- File "root" Line 2 (inconsistent indentation): "   - [[grandchild]]"
- File "root" Line 3 (over-indented): "      - [[greatgrandchild]]"
`;
      // go
      const actlError: string | void = lint(content, opts);
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: undefined = undefined;
      // go
      const actlError: string | void = lint(content, { ...opts, indentSize: 3 });
      // assert
      assert.strictEqual(actlError, expdError);
    });

    it('error; expect 3, has 2', () => {
      // setup
      const expdError: string =
`semtree.lint(): improper indentation found:

- File "root" Line 2 (inconsistent indentation): "  - [[grandchild]]"
- File "root" Line 3 (inconsistent indentation): "    - [[greatgrandchild]]"
`;
      // go
      const actlError: string | void = lint(content, { ...opts, indentSize: 3 });
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: undefined = undefined;
      // go
      const actlError: string | void = lint(content, opts);
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: string =
`semtree.lint(): missing markdown bullet found:

- File "root" Line 3: "  [[grandchild2]]"
`;
      // go
      const actlError: string | void = lint(content, opts);
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: undefined = undefined;
      // go
      const actlError: string | void = lint(content, { ...opts, mkdnList: false });
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: string =
`semtree.lint(): unexpected markdown bullet found:

- File "root" Line 3: "  - [[grandchild2]]"
`;
      // go
      const actlError: string | void = lint(content, { ...opts, mkdnList: false });
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: undefined = undefined;
      // go
      const actlError: string | void = lint(content, opts);
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: string =
`semtree.lint(): missing wikitext found:

- File "root" Line 3: "  - grandchild2"
`;
      // go
      const actlError: string | void = lint(content, opts);
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: undefined = undefined;
      // go
      const actlError: string | void = lint(content, { ...opts, wikitext: false });
      // assert
      assert.strictEqual(actlError, expdError);
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
      const expdError: string =
`semtree.lint(): unexpected wikitext found:

- File "root" Line 3: "  - [[grandchild2]]"
`;
      // go
      const actlError: string | void = lint(content, { ...opts, wikitext: false });
      // assert
      assert.strictEqual(actlError, expdError);
    });

  });

});
