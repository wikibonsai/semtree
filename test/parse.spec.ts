import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTreeOpts, TreeNode } from '../src/lib/types';
import { parse } from '../src/lib/parse';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let opts: SemTreeOpts;

let concreteData: TreeNode[];
let virtualData: TreeNode[];

describe('parse()', () => {

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

  [
    'concrete',
    'virtual',
  ].forEach((trunkType) => {

    describe(`${trunkType} trunk`, () => {

      beforeEach(() => {
        opts = {
          virtualTrunk: (trunkType === 'virtual'),
        };
      });

      it('empty input', () => {
        assert.deepStrictEqual(
          parse(''),
          'semtree.parse(): no root specified and no line with zero indentation found. please provide a root or fix the indentation.',
        );
      });

      describe('single file', () => {

        beforeEach(() => {
          concreteData = [{
            text: 'root',
            ancestors: [],
            children: ['child1', 'child2'],
          },{
            text: 'child1',
            ancestors: ['root'],
            children: [],
          },{
            text: 'child2',
            ancestors: ['root'],
            children: ['grandchild1'],
          },{
            text: 'grandchild1',
            ancestors: ['root', 'child2'],
            children: [],
          }];
          virtualData = [{
            text: 'root',
            ancestors: [],
            children: ['child1', 'child2'],
          },{
            text: 'child1',
            ancestors: ['root'],
            children: [],
          },{
            text: 'child2',
            ancestors: ['root'],
            children: ['grandchild1'],
          },{
            text: 'grandchild1',
            ancestors: ['root', 'child2'],
            children: [],
          }];
        });

        it.skip('root name', () => {
          const content: string = 
`- [[root]]
  - [[child1]]
  - [[child2]]
    - [[grandchild1]]
`;
          // const res = parse(content);
          // assert.deepStrictEqual(res.root, 'root');
        });

        describe('indentation', () => {

          it('indentation; 2 spaces (base)', () => {
            const content: string = 
`- [[root]]
  - [[child1]]
  - [[child2]]
    - [[grandchild1]]
`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

          it('indentation; 3 spaces', () => {
            const content: string = 
`- [[root]]
   - [[child1]]
   - [[child2]]
      - [[grandchild1]]
`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

          it('indentation; 4 spaces', () => {
            const content: string = 
`- [[root]]
    - [[child1]]
    - [[child2]]
        - [[grandchild1]]
`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

          it('indentation; tabs', () => {
            const content: string = 
`- [[root]]
\t- [[child1]]
\t- [[child2]]
\t\t- [[grandchild1]]
`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

        });

        describe('extra newlines', () => {

          it('strip leading newlines', () => {
            const content: string = 
`


- [[root]]
  - [[child1]]
  - [[child2]]
    - [[grandchild1]]
`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

          it('strip trailing newlines', () => {
            const content: string = 
`- [[root]]
  - [[child1]]
  - [[child2]]
    - [[grandchild1]]



`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

        });

        it('accept different markdown list styles', () => {
          const content: string = 
`- [[root]]
  * [[child1]]
  * [[child2]]
    + [[grandchild1]]
`;
          assert.deepStrictEqual(
            parse(content, '', opts),
            trunkType === 'concrete' ? concreteData : virtualData,
          );
        });

        it('no [[wiki]] markers', () => {
          const content: string = 
`- root
  - child1
  - child2
    - grandchild1
`;
          assert.deepStrictEqual(
            parse(content, '', opts),
            trunkType === 'concrete' ? concreteData : virtualData,
          );
        });

        it('no markdown bullet markers', () => {
          const content: string = 
`[[root]]
  [[child1]]
  [[child2]]
    [[grandchild1]]
`;
          assert.deepStrictEqual(
            parse(content, '', opts),
            trunkType === 'concrete' ? concreteData : virtualData,
          );
        });

        describe('configuration options', () => {

          it.skip('option', () => {
            // todo
          });

        });

        describe('error handling', () => {

          it('inconsistent indentation', () => {
            const content: string = 
`- [[root]]
  - [[child1]]
  - [[child2]]
     - [[grandchild1]]
`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              'semtree.lint(): improper indentation found:\n\n- Line 4 (inconsistent indentation): "     - [[grandchild1]]"\n',
            );
          });

          it('duplicate text', () => {
            const content: string = 
`- [[root]]
  - [[child1]]
  - [[child1]]
  - [[child2]]
    - [[grandchild1]]
`;
            assert.strictEqual(
              parse(content, '', opts),
              'semtree.lint(): duplicate entity names found:\n\n- Line 3: "child1"\n'
            );
          });

        });

      });

      describe('multi file', () => {

        beforeEach(() => {
          concreteData = [{
            text: 'root',
            ancestors: [],
            children: ['child1a'],
          },{
            text: 'child1a',
            ancestors: ['root'],
            children: ['grandchild1a', 'branch'],
          },{
            text: 'grandchild1a',
            ancestors: ['root', 'child1a'],
            children: [],
          },{
            text: 'branch',
            ancestors: ['root', 'child1a'],
            children: ['child1b'],
          },{
            text: 'child1b',
            ancestors: ['root', 'child1a', 'branch'],
            children: [],
          }];
          virtualData = [{
            text: 'child1a',
            ancestors: [],
            children: ['grandchild1a', 'child1b'],
          },{
            text: 'grandchild1a',
            ancestors: ['child1a'],
            children: [],
          },{
            text: 'child1b',
            ancestors: ['child1a'],
            children: [],
          }];
        });

        it('default', () => {
          const content: Record<string,string> = {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[branch]]
`,
            'branch':
`- [[child1b]]
`,
          };
          const actlData: TreeNode[] | string = parse(content, 'root', opts);
          const expdData: TreeNode[] = trunkType === 'concrete' ? concreteData : virtualData;
          assert.deepStrictEqual(actlData, expdData);
        });

        it.skip('root name', () => {
          const content: Record<string,string> = {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[branch]]
`,
            'branch':
`- [[child1b]]
`,};
          // const res = parse(content, 'root');
          // assert.strictEqual(res.root, trunkType === 'concrete' ? 'root' : 'child1a');
        });

        // todo: contains bug where virtual levels as the sole branch connection screw up level counting.
        // it.skip('ensure index and entry type nodes can be siblings', () => {
        //   const result = parse(cntntMultiWikiSpace2DashNawIndexnEntrySiblings, 'i.bonsai');
        //   assert.deepStrictEqual(result, trunkType === 'concrete' ? dataConcreteNawIndexnEntrySiblings : dataVirtualNawIndexnEntrySiblings);
        // });

        describe('error handling', () => {

          it('\'content\' param of record type should require \'root\' param', () => {
            const content: Record<string,string> = {
              'root':
  `- [[child1a]]
    - [[grandchild1a]]
    - [[branch]]
  `,
              'branch':
  `- [[child1b]]
  `,};
            assert.strictEqual(
              parse(content, '', opts),
              'semtree.parse(): cannot parse multiple files without a "root" defined',
            );
          });

          it('inconsistent indentation', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1a]]
  - [[grandchild1a]]
   - [[branch]]
`,
              'branch':
`- [[child1b]]
`,};
            assert.strictEqual(
              parse(content, 'root', opts),
              'semtree.lint(): improper indentation found:\n\n- File "root" Line 3 (inconsistent indentation): "   - [[branch]]"\n',
            );
          });

          it('over-indented', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1a]]
  - [[grandchild1a]]
     - [[branch]]
`,
              'branch':
`- [[child1b]]
`,};
            assert.strictEqual(
              parse(content, 'root', opts),
              'semtree.lint(): improper indentation found:\n\n- File "root" Line 3 (inconsistent indentation): "     - [[branch]]"\n',
            );
          });

          describe('concrete-trunk-only error cases', () => {

            it('cycle; self; root (not error case with virtual trunk)', () => {
              const content: Record<string,string> = {
                'root':
`- [[root]]
  - [[child1a]]
    - [[grandchild1a]]
      - [[branch]]
`,
                'branch':
`- [[child1b]]
`,};
              if (trunkType === 'concrete') {
                assert.strictEqual(
                  parse(content, 'root', opts),
                  `semtree.checkDuplicates(): tree did not build, duplicate nodes found:

root

`,
                );
              } else {
                assert.deepStrictEqual(
                  parse(content, 'root', opts),
                  [{
                    text: 'root',
                    ancestors: [],
                    children: ['child1a'],
                  },{
                    text: 'child1a',
                    ancestors: ['root'],
                    children: ['grandchild1a'],
                  },{
                    text: 'grandchild1a',
                    ancestors: ['root', 'child1a'],
                    children: ['child1b'],
                  },{
                    text: 'child1b',
                    ancestors: ['root', 'child1a', 'grandchild1a'],
                    children: [],
                  }],
                );
              }
            });

            it('cycle; self; branch', () => {
              const content: Record<string,string> = {
                'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[branch]]
`,
                'branch':
`- [[branch]]
- [[child1b]]
`,};
              assert.strictEqual(
                parse(content, 'root', opts),
                `semtree.lint(): duplicate entity names found:

- File "branch" Line 1: "branch"
`,
              );
            });

            it('cycle; cross-file; root', () => {
              const content: Record<string,string> = {
                'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[branch]]
`,
                'branch':
`- [[root]]
`,};
              assert.strictEqual(
                parse(content, 'root', opts),
                'semtree.buildTree(): cycle detected involving node "root"',
              );
            });

            it('cycle; cross-file; branch', () => {
              const content: Record<string,string> = {
                'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[branch1]]
`,
                'branch1':
`- [[branch2]]
`,
                'branch2':
`- [[branch1]]
`};
              assert.strictEqual(
                parse(content, 'root', opts),
                `semtree.lint(): duplicate entity names found:

- File "branch2" Line 1: "branch1"
`,
              );
            });

          });

        });

      });

    });

  });

});