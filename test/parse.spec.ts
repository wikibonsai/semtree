import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTree, SemTreeOpts } from '../src/lib/types';
import { create } from '../src/lib/parse';


let fakeConsoleWarn: sinon.SinonSpy;

let concreteData: SemTree;
let virtualData: SemTree;

let opts: SemTreeOpts;

describe('create()', () => {

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
          create(''),
          'semtree.parse(): no root specified and no line with zero indentation found. please provide a root or fix the indentation.',
        );
      });

      describe('single file', () => {

        beforeEach(() => {
          concreteData = {
            root: 'root',
            trunk: ['root'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
              'grandchild1': 'root',
              'grandchild2': 'root',
              'greatgrandchild1': 'root',
            },
            nodes: [{
              text: 'root',
              ancestors: [],
              children: ['child1'],
            },{
              text: 'child1',
              ancestors: ['root'],
              children: ['grandchild1', 'grandchild2'],
            },{
              text: 'grandchild1',
              ancestors: ['root', 'child1'],
              children: [],
            },{
              text: 'grandchild2',
              ancestors: ['root', 'child1'],
              children: ['greatgrandchild1'],
            },{
              text: 'greatgrandchild1',
              ancestors: ['root', 'child1', 'grandchild2'],
              children: [],
            }]
          };
          virtualData = {
            root: 'child1',
            trunk: [],
            petioleMap: {},
            nodes: [{
              text: 'child1',
              ancestors: [],
              children: ['grandchild1', 'grandchild2'],
            },{
              text: 'grandchild1',
              ancestors: ['child1'],
              children: [],
            },{
              text: 'grandchild2',
              ancestors: ['child1'],
              children: ['greatgrandchild1'],
            },{
              text: 'greatgrandchild1',
              ancestors: ['child1', 'grandchild2'],
              children: [],
            }]
          };
          // data = (trunkType === 'concrete') ? concreteData : virtualData;
        });

        const testSingleFile = (description: string, content: string) => {
          it(description, () => {
            const actl: SemTree | string = create(content, 'root', opts);
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });
        };

        describe('indentation', () => {

          testSingleFile('2 spaces (base)',
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`);

          testSingleFile('3 spaces',
`- [[child1]]
   - [[grandchild1]]
   - [[grandchild2]]
      - [[greatgrandchild1]]
`);

          testSingleFile('4 spaces',
`- [[child1]]
    - [[grandchild1]]
    - [[grandchild2]]
        - [[greatgrandchild1]]
`);

          testSingleFile('1 tab',
`- [[child1]]
\t- [[grandchild1]]
\t- [[grandchild2]]
\t\t- [[greatgrandchild1]]
`);

          testSingleFile('2 tabs',
`- [[child1]]
\t\t- [[grandchild1]]
\t\t- [[grandchild2]]
\t\t\t\t- [[greatgrandchild1]]
`);

        });

        describe('extra newlines', () => {

          testSingleFile('strip leading newlines',
`


- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`);

          testSingleFile('strip trailing newlines',
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]



`);

          testSingleFile('accept different markdown list styles',
`- [[child1]]
  * [[grandchild1]]
  * [[grandchild2]]
    + [[greatgrandchild1]]
`);

        });

        describe('options', () => {

          testSingleFile('lvlSize',
`- [[child1]]
    - [[grandchild1]]
    - [[grandchild2]]
        - [[greatgrandchild1]]
`);

          testSingleFile('mkdnList: false',
`[[child1]]
  [[grandchild1]]
  [[grandchild2]]
    [[greatgrandchild1]]
`);

          testSingleFile('wikitext: false', `
- child1
  - grandchild1
  - grandchild2
    - greatgrandchild1
`);

          // todo: test mkdnList,wikitext false and show how parse will handle it if they exist

        });

        describe('error handling', () => {

          const testError = (description: string, content: string, error: string) => {
            it(description, () => {
              const actl: SemTree | string = create(content, 'root', opts);
              const expd: string = error;
              assert.strictEqual(actl, expd);
            });
          };

          testError('no root; 0-indented entries only',
`- [[child1]]
- [[child2]]
- [[child3]]
`,
            'semtree.parse(): multiple lines with zero indentation found. A tree with multiple roots cannot be made. Please add a filename as a "root" parameter or fix the indentation.'
          );

          testError('inconsistent indentation',
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
     - [[greatgrandchild1]]
`,
            'semtree.lint(): improper indentation found:\n\n- Line 4 (inconsistent indentation): "     - [[greatgrandchild1]]"\n',
          );

          testError('duplicate text',
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`,
            'semtree.lint(): duplicate entity names found:\n\n- Line 4: "grandchild2"\n',
          );

        });

      });

      describe('multi file', () => {

        beforeEach(() => {
          concreteData = {
            root: 'root',
            trunk: ['root', 'branch'],
            petioleMap: {
              'root': 'root',
              'child1a': 'root',
              'grandchild1a': 'root',
              'branch': 'root',
              'child1b': 'branch',
            },
            nodes: [{
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
            }]
          };
          virtualData = {
            root: 'child1a',
            trunk: [],
            petioleMap: {},
            nodes: [{
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
            }]
          };
        });

        // todo
        // const testMultiFile = (description: string, content: string) => {
        //   it(description, () => {
        //     const actl: SemTree | string = parse(content, 'root', opts);
        //     const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
        //     assert.deepStrictEqual(actl, expd);
        //   });
        // };

        describe('default', () => {

          it('one file (in multi-file format)', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[child1b]]
`
            };
            const actlData: SemTree | string = create(content, 'root', opts);
            const expdData: SemTree = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root'],
              petioleMap: {
                'root': 'root',
                'child1a': 'root',
                'grandchild1a': 'root',
                'child1b': 'root',
              },
              nodes: [
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
              ]
            } : {
              root: 'child1a',
              trunk: [],
              petioleMap: {},
              nodes: [
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
              ]
            };
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
            const actlData: SemTree | string = create(content, 'root', opts);
            const expdData: SemTree = trunkType === 'concrete' ? concreteData : virtualData;
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
            const actlData: SemTree | string = create(content, 'root', opts);
            const expdData: SemTree = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root', 'branch1', 'branch2'],
              petioleMap: {
                'root': 'root',
                'child1a': 'root',
                'branch1': 'root',
                'branch2': 'root',
                'child1b': 'branch1',
                'child1c': 'branch2',
              },
              nodes: [
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
              ]
            } : {
              root: 'child1a',
              trunk: [],
              petioleMap: {},
              nodes: [
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
              ]
            };
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
            const actlData: SemTree | string = create(content, 'root', opts);
            const expdData: SemTree = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root'],
              petioleMap: {
                'root': 'root',
                'branch1': 'root',
                'child1b': 'branch1',
                'child2b': 'branch1',
              },
              nodes: [
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
              ]
            } : {
              root: 'child1b',
              trunk: [],
              petioleMap: {},
              nodes: [
                {
                  text: 'child1b',
                  ancestors: [],
                  children: ['child2b'],
                },{
                  text: 'child2b',
                  ancestors: ['child1b'],
                  children: [],
                }
              ]
            };
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
            const actlData: SemTree | string = create(content, 'root', opts);
            const expdData: SemTree = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root'],
              petioleMap: {
                'root': 'root',
                'branch1': 'root',
                'child1b': 'branch1',
                'child2b': 'branch1',
                'child1a': 'root',
              },
              nodes: [
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
              ]
            } : {
              root: 'child1a',
              trunk: [],
              petioleMap: {},
              nodes: [
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
              ]
            };
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
            const actlData: SemTree | string = create(content, 'root', opts);
            const expdData: SemTree = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root'],
              petioleMap: {
                'root': 'root',
                'branch1': 'root',
                'branch2': 'branch1',
                'child1c': 'branch2',
              },
              nodes: [
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
              ]
            } : {
              root: 'child1c',
              trunk: [],
              petioleMap: {},
              nodes: [
                {
                  text: 'child1c',
                  ancestors: [],
                  children: [],
                }
              ]
            };
            assert.deepStrictEqual(actlData, expdData);
          });

        });

        describe('options', () => {

          it.skip('lvlSize', () => {
            assert.strictEqual(0, 1);
          });

          it.skip('mkdnList: false', () => {
            assert.strictEqual(0, 1);
          });

          it.skip('wikitext: false', () => {
            assert.strictEqual(0, 1);
          });

        });

        describe('error handling', () => {

          const testErrorMultiFile = (description: string, content: Record<string, string>, root: string | undefined, error: string) => {
            it(description, () => {
              const actl: SemTree | string = create(content, root, opts);
              const expd: string = error;
              assert.strictEqual(actl, expd);
            });
          };

          testErrorMultiFile('\'content\' param of record type should require \'root\' param', {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[branch]]
`,
            'branch':
`- [[child1b]]
`
            },
            undefined,
            'semtree.parse(): cannot parse multiple files without a "root" defined',
          );

          testErrorMultiFile('inconsistent indentation', {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
   - [[branch]]
`,
            'branch':
`- [[child1b]]
`,
            },
            'root',
            'semtree.lint(): improper indentation found:\n\n- File "root" Line 3 (inconsistent indentation): "   - [[branch]]"\n',
          );

          testErrorMultiFile('over-indented', {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
     - [[branch]]
`,
            'branch':
`- [[child1b]]
`,
            },
            'root',
            'semtree.lint(): improper indentation found:\n\n- File "root" Line 3 (inconsistent indentation): "     - [[branch]]"\n',
          );

          testErrorMultiFile('no root; all branches contain all 0-indented entries', {
            'root':
`- [[branch1]]
- [[child1a]]
`,
            'branch1':
`- [[child1b]]
- [[child2b]]
`,
            },
            'root',
            'semtree.parse(): lvlSize could not be determined -- is it possible no root exists?',
          );

          testErrorMultiFile('cycle; self; branch', {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
- [[branch]]
`,
            'branch':
`- [[branch]]
- [[child1b]]
`,
            },
            'root',
            `semtree.lint(): duplicate entity names found:

- File "branch" Line 1: "branch"
`,
          );

          testErrorMultiFile('cycle; cross-file; root', {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
- [[branch]]
`,
            'branch':
`- [[root]]
`,},
            'root',
            'semtree.buildTree(): cycle detected involving node "root"',
          );

          testErrorMultiFile('cycle; cross-file; branch', {
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
`},
          'root',
          `semtree.lint(): duplicate entity names found:

- File "branch2" Line 1: "branch1"
`,
          );

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
                  create(content, 'root', opts),
                  `semtree.checkDuplicates(): tree did not build, duplicate nodes found:

root

`,
                );
              } else {
                assert.deepStrictEqual(
                  create(content, 'root', opts),
                  {
                    root: 'root',
                    trunk: [],
                    petioleMap: {},
                    nodes: [
                      {
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
                      }
                    ]
                  },
                );
              }
            });

          });

        });

      });

    });

  });

});
