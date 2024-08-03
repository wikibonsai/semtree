import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { TreeNode } from '../src/lib/types';
import { parse } from '../src/lib/parse';
import { print } from '../src/lib/print';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;

describe('print()', () => {

  beforeEach(() => {
    console.warn = (msg) => msg + '\n';
    fakeConsoleWarn = sinon.spy(console, 'warn');
    console.log = (msg) => msg + '\n';
    fakeConsoleLog = sinon.spy(console, 'log');
  });

  afterEach(() => {
    fakeConsoleWarn.restore();
    fakeConsoleLog.restore();
  });

  describe('concrete trunk', () => {

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
        const nodes: TreeNode[] | string = parse(content, 'root');
        assert.strictEqual(typeof nodes, 'object');
        const expdTreeStr: string =
`root
└── child
    ├── branch1
    |   ├── child1b
    |   └── branch2
    |       └── child2b
    └── grandchild
        └── greatgrandchild
`;
        // assert                           // go
        // @ts-expect-error: previous assert catches this
        const actlRes: string | undefined = print(nodes);
        assert.strictEqual(actlRes, expdTreeStr);
        const actlOutput: string | void = fakeConsoleLog.getCall(0).args[0];
        assert.strictEqual(actlOutput, expdTreeStr);
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
        const nodes: TreeNode[] | string = parse(content, 'root', { virtualTrunk: true });
        assert.strictEqual(typeof nodes, 'object');
        const expdTreeStr: string =
`child
├── child1b
├── child2b
└── grandchild
    └── greatgrandchild
`;
        // assert                           // go
        // @ts-expect-error: previous assert catches this
        const actlRes: string | undefined = print(nodes);
        assert.strictEqual(actlRes, expdTreeStr);
        const actlOutput: string | void = fakeConsoleLog.getCall(0).args[0];
        assert.strictEqual(actlOutput, expdTreeStr);
      });

    });

  });

});
