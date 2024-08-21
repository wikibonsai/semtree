import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTree } from '../src/lib/types';
import { print } from '../src/lib/print';

let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;

describe('print()', () => {

  beforeEach(() => {
    console.log = (msg) => msg + '\n';
    fakeConsoleLog = sinon.spy(console, 'log');
    console.warn = (msg) => msg + '\n';
    fakeConsoleWarn = sinon.spy(console, 'warn');
  });

  afterEach(() => {
    fakeConsoleWarn.restore();
    fakeConsoleLog.restore();
  });

  describe('concrete trunk', () => {

    describe('multi', () => {

      it('default', () => {
        // setup
        const tree: SemTree = {
          root: 'root',
          nodes: [
            { text: 'root', ancestors: [], children: ['child'] },
            { text: 'child', ancestors: ['root'], children: ['branch1', 'grandchild'] },
            { text: 'branch1', ancestors: ['root', 'child'], children: ['child1b', 'branch2'] },
            { text: 'grandchild', ancestors: ['root', 'child'], children: ['greatgrandchild'] },
            { text: 'child1b', ancestors: ['root', 'child', 'branch1'], children: [] },
            { text: 'branch2', ancestors: ['root', 'child', 'branch1'], children: ['child2b'] },
            { text: 'child2b', ancestors: ['root', 'child', 'branch1', 'branch2'], children: [] },
            { text: 'greatgrandchild', ancestors: ['root', 'child', 'grandchild'], children: [] },
          ],
          trunk: ['root', 'branch1', 'branch2'],
          petioleMap: {
            'root': 'root',
            'child': 'root',
            'branch1': 'root',
            'grandchild': 'root',
            'child1b': 'branch1',
            'branch2': 'branch1',
            'child2b': 'branch2',
            'greatgrandchild': 'root',
          },
          orphans: [],
        };
        const expdTreeStr: string = 'root\n'
                                  + '└── child\n'
                                  + '    ├── branch1\n'
                                  + '    |   ├── child1b\n'
                                  + '    |   └── branch2\n'
                                  + '    |       └── child2b\n'
                                  + '    └── grandchild\n'
                                  + '        └── greatgrandchild\n';
        // assert                           // go
        const actlRes: string | undefined = print(tree);
        assert.strictEqual(actlRes, expdTreeStr);
        const actlOutput: string | void = fakeConsoleLog.getCall(0).args[0];
        assert.strictEqual(actlOutput, expdTreeStr);
      });

    });

  });

  describe('virtual trunk', () => {

    describe('multi', () => {

      it('default', () => {
        // setup
        const tree: SemTree = {
          root: 'child',
          nodes: [
            { text: 'child', ancestors: [], children: ['child1b', 'child2b', 'grandchild'] },
            { text: 'child1b', ancestors: ['child'], children: [] },
            { text: 'child2b', ancestors: ['child'], children: [] },
            { text: 'grandchild', ancestors: ['child'], children: ['greatgrandchild'] },
            { text: 'greatgrandchild', ancestors: ['child', 'grandchild'], children: [] },
          ],
          trunk: ['child'],
          petioleMap: {
            'child': 'child',
            'child1b': 'child',
            'child2b': 'child',
            'grandchild': 'child',
            'greatgrandchild': 'child',
          },
          orphans: [],
        };
        const expdTreeStr: string = 'child\n'
                                  + '├── child1b\n'
                                  + '├── child2b\n'
                                  + '└── grandchild\n'
                                  + '    └── greatgrandchild\n';
        // assert                           // go
        const actlRes: string | undefined = print(tree);
        assert.strictEqual(actlRes, expdTreeStr);
        const actlOutput: string | void = fakeConsoleLog.getCall(0).args[0];
        assert.strictEqual(actlOutput, expdTreeStr);
      });
    });
  });

  describe('printing option', () => {

    it('should return string without printing when printing is false', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        nodes: [
          { text: 'root', ancestors: [], children: ['child1', 'child2'] },
          { text: 'child1', ancestors: ['root'], children: [] },
          { text: 'child2', ancestors: ['root'], children: [] },
        ],
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
          'child2': 'root',
        },
        orphans: [],
      };
      const expdTreeStr: string = 'root\n'
                                + '├── child1\n'
                                + '└── child2\n';
      // assert                           // go
      const actlRes: string | undefined = print(tree, false);
      assert.strictEqual(actlRes, expdTreeStr);
      assert.strictEqual(fakeConsoleLog.called, false);
    });

  });

});
