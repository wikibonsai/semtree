import assert from 'node:assert/strict';
import sinon from 'sinon';

import { SemTree } from '../src/index';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;

describe('print()', () => {

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

  describe('concrete trunk', () => {

    beforeEach(() => {
      semtree = new SemTree();
    });

    describe('single', () => {

      it.skip('test', () => {
        assert.strictEqual(0, 1);
      });

    });

    describe('multi', () => {

      it('default', () => {
        // setup
        const content: Record<string, string> = {
          'root':
`- [[child]]
  - [[branch1]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
          'branch1':
`- [[child1b]]
- [[branch2]]
`,
          'branch2':
`- [[child2b]]
`,
        };
        semtree.parse(content, 'root');
        // go
        semtree.print();
        // assert
        const expdOutput: string =
`root
└── child
    ├── branch1
    |   ├── child1b
    |   └── branch2
    |       └── child2b
    └── grandchild
        └── greatgrandchild
`;
        const actlOutput: string | void = fakeConsoleLog.getCall(0).args[0];
        assert.strictEqual(actlOutput, expdOutput);
      });

    });

  });

  describe('virtual trunk', () => {

    describe('single', () => {

      it.skip('test', () => {
        assert.strictEqual(0, 1);
      });

    });

    describe('multi', () => {

      it('default', () => {
        // setup
        const content: Record<string, string> = {
          'root':
`- [[child]]
  - [[branch1]]
  - [[grandchild]]
    - [[greatgrandchild]]
`,
          'branch1':
`- [[child1b]]
- [[branch2]]
`,
          'branch2':
`- [[child2b]]
`,
        };
        semtree.parse(content, 'root');
        // go
        semtree.print();
        // assert
        const expdOutput: string =
`child
├── child1b
├── child2b
└── grandchild
    └── greatgrandchild
`;
        const actlOutput: string | void = fakeConsoleLog.getCall(0).args[0];
        assert.strictEqual(actlOutput, expdOutput);
      });

    });

  });

});
