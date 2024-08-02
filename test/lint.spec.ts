import assert from 'node:assert/strict';
import sinon from 'sinon';

import { lint, SemTree } from '../src/index';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;

describe('lint()', () => {

  beforeEach(() => {
    console.warn = (msg) => msg + '\n';
    fakeConsoleWarn = sinon.spy(console, 'warn');
    console.log = (msg) => msg + '\n';
    fakeConsoleLog = sinon.spy(console, 'log');
    semtree = new SemTree({
      virtualTrunk: true,
    });
  });

  afterEach(() => {
    semtree.clear();
    fakeConsoleWarn.restore();
    fakeConsoleLog.restore();
  });

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
