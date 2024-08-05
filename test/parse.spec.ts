import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTreeOpts, TreeNode } from '../src/lib/types';
import { parse } from '../src/lib/parse';


let fakeConsoleWarn: sinon.SinonSpy;

let concreteData: TreeNode[];
let virtualData: TreeNode[];

let opts: SemTreeOpts;

describe('parse()', () => {

  [
    'concrete',
    'virtual',
  ].forEach((trunkType) => {

    describe(`${trunkType} trunk`, () => {

      beforeEach(() => {
        console.warn = (msg) => msg + '\n';
        fakeConsoleWarn = sinon.spy(console, 'warn');
        opts = {
          virtualTrunk: (trunkType === 'virtual'),
        };
      });

      afterEach(() => {
        fakeConsoleWarn.restore();
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

        // todo: ensure (tree) shape of results
        it.skip('default', () => {
          const content: string = 
`- [[root]]
  - [[child1]]
  - [[child2]]
    - [[grandchild1]]
`;
          // todo: return full tree
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

          it('indentation; 1 tab', () => {
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

          it('indentation; 2 tabs', () => {
            const content: string = 
`- [[root]]
\t\t- [[child1]]
\t\t- [[child2]]
\t\t\t\t- [[grandchild1]]
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

        describe('options', () => {

          it('lvlSize', () => {
            const content: string = 
`- [[root]]
    - [[child1]]
    - [[child2]]
        - [[grandchild1]]
`;
            const customOpts = { ...opts, lvlSize: 4 };
            assert.deepStrictEqual(
              parse(content, '', customOpts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

          it('mkdnList', () => {
            const content: string = 
`root
    child1
    child2
        grandchild1
`;
            const customOpts = { ...opts, mkdnList: false };
            assert.deepStrictEqual(
              parse(content, '', customOpts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

          it('wikitext', () => {
            const content: string = 
`- root
    - child1
    - child2
        - grandchild1
`;
            const customOpts = { ...opts, wikitext: false };
            assert.deepStrictEqual(
              parse(content, '', customOpts),
              trunkType === 'concrete' ? concreteData : virtualData,
            );
          });

        });

        describe('error handling', () => {

          it('no root; 0-indented entries only', () => {
            const content: string = 
`- [[root]]
- [[child1]]
- [[child2]]
- [[child3]]
`;
            assert.deepStrictEqual(
              parse(content, '', opts),
              'semtree.parse(): multiple lines with zero indentation found. A tree with multiple roots cannot be made. Please add a filename as a "root" parameter or fix the indentation.',
            );
          });

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

        describe('default', () => {

          it('one file (in multi-file format)', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[child1b]]
`
            };
            const actlData: TreeNode[] | string = parse(content, 'root', opts);
            const expdData: TreeNode[] = trunkType === 'concrete' ? [
              {
                text: 'root',
                ancestors: [],
                children: ['child1a'],
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: ['grandchild1a', 'child1b'],
              },{
                text: 'grandchild1a',
                ancestors: ['root', 'child1a'],
                children: [],
              },{
                text: 'child1b',
                ancestors: ['root', 'child1a'],
                children: [],
              }
            ] : [
              {
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
              }
            ];
            assert.deepStrictEqual(actlData, expdData);
          });

          it('two files', () => {
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

          it('three files', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1a]]
  - [[branch1]]
  - [[branch2]]
`,
              'branch1':
`- [[child1b]]
`,
              'branch2':
`- [[child1c]]
`
            };
            const actlData: TreeNode[] | string = parse(content, 'root', opts);
            const expdData: TreeNode[] = trunkType === 'concrete' ? [
              {
                text: 'root',
                ancestors: [],
                children: ['child1a'],
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: ['branch1', 'branch2'],
              },{
                text: 'branch1',
                ancestors: ['root', 'child1a'],
                children: ['child1b'],
              },{
                text: 'child1b',
                ancestors: ['root', 'child1a', 'branch1'],
                children: [],
              },{
                text: 'branch2',
                ancestors: ['root', 'child1a'],
                children: ['child1c'],
              },{
                text: 'child1c',
                ancestors: ['root', 'child1a', 'branch2'],
                children: [],
              }
            ] : [
              {
                text: 'child1a',
                ancestors: [],
                children: ['child1b', 'child1c'],
              },{
                text: 'child1b',
                ancestors: ['child1a'],
                children: [],
              },{
                text: 'child1c',
                ancestors: ['child1a'],
                children: [],
              }
            ];
            assert.deepStrictEqual(actlData, expdData);
          });

          it.skip('indentation not on root file', () => {
            const content: Record<string,string> = {
              'root':
`- [[branch1]]
`,
              'branch1':
`- [[child1b]]
  - [[child2b]]
`,
            };
            const actlData: TreeNode[] | string = parse(content, 'root', opts);
            const expdData: TreeNode[] = trunkType === 'concrete' ? [
              {
                text: 'root',
                ancestors: [],
                children: ['branch1'],
              },{
                text: 'branch1',
                ancestors: ['root'],
                children: ['child1b'],
              },{
                text: 'child1b',
                ancestors: ['root', 'branch1'],
                children: ['child2b'],
              },{
                text: 'child2b',
                ancestors: ['root', 'branch1', 'child1b'],
                children: [],
              }
            ] : [
              {
                text: 'child1b',
                ancestors: [],
                children: ['child2b'],
              },{
                text: 'child2b',
                ancestors: ['child1b'],
                children: [],
              }
            ];
            assert.deepStrictEqual(actlData, expdData);
          });

          it.skip('root file\'s root node is a branch file', () => {
            const content: Record<string,string> = {
              'root':
`- [[branch1]]
`,
              'branch1':
`- [[child1b]]
  - [[child2b]]
`,
            };
            const actlData: TreeNode[] | string = parse(content, 'root', opts);
            const expdData: TreeNode[] = trunkType === 'concrete' ? [
              {
                text: 'root',
                ancestors: [],
                children: ['branch1', 'child1a'],
              },{
                text: 'branch1',
                ancestors: ['root'],
                children: ['child1b'],
              },{
                text: 'child1b',
                ancestors: ['root', 'branch1'],
                children: ['child2b'],
              },{
                text: 'child2b',
                ancestors: ['root', 'branch1', 'child1b'],
                children: [],
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: [],
              },
            ] : [
              {
                text: 'child1a',
                ancestors: [],
                children: [],
              },{
                text: 'child1b',
                ancestors: [],
                children: ['child2b'],
              },{
                text: 'child2b',
                ancestors: ['child1b'],
                children: [],
              }
            ];
            assert.deepStrictEqual(actlData, expdData);
            assert.strictEqual(fakeConsoleWarn.callCount, 1);
            assert.strictEqual(
              fakeConsoleWarn.firstCall.args[0],
              'semtree.parse(): indentation found in non-root file "branch1". This may lead to unexpected results.\n'
            );
          });


          it.skip('path only contains branch index files', () => {
            const content: Record<string,string> = {
              'root':
`- [[branch1]]
`,
              'branch1':
`- [[branch2]]
`,
              'branch2':
`- [[child1c]]
`
            };
            const actlData: TreeNode[] | string = parse(content, 'root', opts);
            const expdData: TreeNode[] = trunkType === 'concrete' ? [
              {
                text: 'root',
                ancestors: [],
                children: ['branch1'],
              },{
                text: 'branch1',
                ancestors: ['root'],
                children: ['branch2'],
              },{
                text: 'branch2',
                ancestors: ['root', 'branch1'],
                children: ['child1c'],
              },{
                text: 'child1c',
                ancestors: ['root', 'branch1', 'branch2'],
                children: [],
              }
            ] : [
              {
                text: 'child1c',
                ancestors: [],
                children: [],
              }
            ];
            assert.deepStrictEqual(actlData, expdData);
          });

        });

        describe('options', () => {

          it.skip('lvlSize', () => {
            assert.strictEqual(0, 1);
          });

          it.skip('mkdnList', () => {
            assert.strictEqual(0, 1);
          });

          it.skip('wikitext', () => {
            assert.strictEqual(0, 1);
          });

        });

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

          it('no root; all branches contain all 0-indented entries', () => {
            const content: Record<string,string> = {
              'root':
`- [[branch1]]
- [[child1a]]
`,
              'branch1':
`- [[child1b]]
- [[child2b]]
`,
            };
            assert.deepStrictEqual(
              parse(content, 'root', opts),
              'semtree.parse(): lvlSize could not be determined -- is it possible no root exists?',
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