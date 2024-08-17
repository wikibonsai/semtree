import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTree, SemTreeOpts } from '../src/lib/types';
import { create } from '../src/lib/create';


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
          create('', {}, opts),
          'semtree.build(): no content provided',
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

        describe('indentation', () => {

          it('2 spaces (default)', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, opts);
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('3 spaces', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
   - [[grandchild1]]
   - [[grandchild2]]
      - [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, { ...opts, indentSize: 3 });
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('4 spaces', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
    - [[grandchild1]]
    - [[grandchild2]]
        - [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, { ...opts, indentSize: 4 });
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('1 tab', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
\t- [[grandchild1]]
\t- [[grandchild2]]
\t\t- [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, { ...opts, indentSize: 1 });
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('2 tabs', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
\t\t- [[grandchild1]]
\t\t- [[grandchild2]]
\t\t\t\t- [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, { ...opts, indentSize: 2 });
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

        });

        describe('extra newlines', () => {

          it('strip leading newlines', () => {
            const content: Record<string,string> = {
              'root':
`


- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, opts);
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('strip trailing newlines', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]



`};
            const actl: SemTree | string = create('root', content, opts);
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('accept different markdown list styles', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
  * [[grandchild1]]
  * [[grandchild2]]
    + [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, opts);
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

        });

        describe('options', () => {

          it('indentSize', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
    - [[grandchild1]]
    - [[grandchild2]]
        - [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, { ...opts, indentSize: 4 });
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('mkdnList: false', () => {
            const content: Record<string,string> = {
              'root':
`[[child1]]
  [[grandchild1]]
  [[grandchild2]]
    [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, { ...opts, mkdnList: false });
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          it('wikitext: false', () => {
            const content: Record<string,string> = {
              'root':
`- child1
  - grandchild1
  - grandchild2
    - greatgrandchild1
`};
            const actl: SemTree | string = create('root', content, { ...opts, wikitext: false });
            const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
            assert.deepStrictEqual(actl, expd);
          });

          // todo: test mkdnList,wikitext false and show how parse will handle it if they exist

        });

        describe('error handling', () => {

          it('inconsistent indentation', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
     - [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, opts);
            const expd: string = 'semtree.lint(): improper indentation found:\n\n- File "root" Line 4 (inconsistent indentation): "     - [[greatgrandchild1]]"\n';
            assert.strictEqual(actl, expd);
          });

          it('duplicate text', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`};
            const actl: SemTree | string = create('root', content, opts);
            const expd: string = 'semtree.lint(): duplicate entity names found:\n\n- File "root" Line 4: "grandchild2"\n';
            assert.strictEqual(actl, expd);
          });

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

        describe('default', () => {

          it('one file (in multi-file format)', () => {
            const content: Record<string,string> = {
              'root':
`- [[child1a]]
  - [[grandchild1a]]
  - [[child1b]]
`
            };
            const actlData: SemTree | string = create('root', content, opts);
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
            const actlData: SemTree | string = create('root', content, opts);
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
            const actlData: SemTree | string = create('root', content, opts);
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

          it('deep backtracking', () => {
            const content: Record<string,string> = {
              'root':
`- [[childa]]
  - [[grandchild]]
    - [[greatgrandchild1]]
      - [[greatgreatgrandchild]]
        - [[greatgreatgreatgrandchild]]
  - [[branch]]
    - [[greatgrandchild2]]
`,
              'branch':
`- [[childb]]
`,
            };
            const actlData: SemTree | string = create('root', content, opts);
            const expdData: SemTree = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root', 'branch'],
              petioleMap: {
                'root': 'root',
                'childa': 'root',
                'grandchild': 'root',
                'greatgrandchild1': 'root',
                'greatgreatgrandchild': 'root',
                'greatgreatgreatgrandchild': 'root',
                'branch': 'root',
                'childb': 'branch',
                'greatgrandchild2': 'root',
              },
              nodes: [
                {
                  text: 'root',
                  ancestors: [],
                  children: ['childa'],
                },{
                  text: 'childa',
                  ancestors: ['root'],
                  children: ['grandchild', 'branch'],
                },{
                  text: 'grandchild',
                  ancestors: ['root', 'childa'],
                  children: ['greatgrandchild1'],
                },{
                  text: 'greatgrandchild1',
                  ancestors: ['root', 'childa', 'grandchild'],
                  children: ['greatgreatgrandchild'],
                },{
                  text: 'greatgreatgrandchild',
                  ancestors: ['root', 'childa', 'grandchild', 'greatgrandchild1'],
                  children: ['greatgreatgreatgrandchild'],
                },{
                  text: 'greatgreatgreatgrandchild',
                  ancestors: ['root', 'childa', 'grandchild', 'greatgrandchild1', 'greatgreatgrandchild'],
                  children: [],
                },{
                  text: 'branch',
                  ancestors: ['root', 'childa'],
                  children: ['childb', 'greatgrandchild2'],
                },{
                  text: 'childb',
                  ancestors: ['root', 'childa', 'branch'],
                  children: [],
                },{
                  text: 'greatgrandchild2',
                  ancestors: ['root', 'childa', 'branch'],
                  children: [],
                },
              ]
            } : {
              root: 'childa',
              trunk: [],
              petioleMap: {},
              nodes: [
                {
                  text: 'childa',
                  ancestors: [],
                  children: ['grandchild', 'childb'],
                },{
                  text: 'grandchild',
                  ancestors: ['childa'],
                  children: ['greatgrandchild1'],
                },{
                  text: 'greatgrandchild1',
                  ancestors: ['childa', 'grandchild'],
                  children: ['greatgreatgrandchild'],
                },{
                  text: 'greatgreatgrandchild',
                  ancestors: ['childa', 'grandchild', 'greatgrandchild1'],
                  children: ['greatgreatgreatgrandchild'],
                },{
                  text: 'greatgreatgreatgrandchild',
                  ancestors: ['childa', 'grandchild', 'greatgrandchild1', 'greatgreatgrandchild'],
                  children: [],
                },{
                  text: 'childb',
                  ancestors: ['childa'],
                  children: ['greatgrandchild2'],
                },{
                  text: 'greatgrandchild2',
                  ancestors: ['childa', 'childb'],
                  children: [],
                },
              ]
            };
            assert.deepStrictEqual(actlData, expdData);
          });

          it('deep backtracking to root file', () => {
            const content: Record<string,string> = {
              'root':
`- [[childa]]
  - [[grandchild]]
    - [[greatgrandchild]]
      - [[greatgreatgrandchild]]
        - [[greatgreatgreatgrandchild]]
- [[branch]]
`,
              'branch':
`- [[childb]]
`,
            };
            const actlData: SemTree | string = create('root', content, opts);
            const expdData: SemTree | string = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root', 'branch'],
              petioleMap: {
                'root': 'root',
                'childa': 'root',
                'grandchild': 'root',
                'greatgrandchild': 'root',
                'greatgreatgrandchild': 'root',
                'greatgreatgreatgrandchild': 'root',
                'branch': 'root',
                'childb': 'branch',
              },
              nodes: [
                {
                  text: 'root',
                  ancestors: [],
                  children: ['childa', 'branch'],
                },{
                  text: 'childa',
                  ancestors: ['root'],
                  children: ['grandchild'],
                },{
                  text: 'grandchild',
                  ancestors: ['root', 'childa'],
                  children: ['greatgrandchild'],
                },{
                  text: 'greatgrandchild',
                  ancestors: ['root', 'childa', 'grandchild'],
                  children: ['greatgreatgrandchild'],
                },{
                  text: 'greatgreatgrandchild',
                  ancestors: ['root', 'childa', 'grandchild', 'greatgrandchild'],
                  children: ['greatgreatgreatgrandchild'],
                },{
                  text: 'greatgreatgreatgrandchild',
                  ancestors: ['root', 'childa', 'grandchild', 'greatgrandchild', 'greatgreatgrandchild'],
                  children: [],
                },{
                  text: 'branch',
                  ancestors: ['root'],
                  children: ['childb'],
                },{
                  text: 'childb',
                  ancestors: ['root', 'branch'],
                  children: [],
                }
              ]
            } : 'semtree.build(): cannot have multiple root nodes, node "childb" at same level as root node "childa"';
            assert.deepStrictEqual(actlData, expdData);
          });

          it('indentation not on root file', () => {
            const content: Record<string,string> = {
              'root':
`- [[branch1]]
`,
              'branch1':
`- [[child1b]]
  - [[child2b]]
`,
            };
            const actlData: SemTree | string = create('root', content, opts);
            const expdData: SemTree = trunkType === 'concrete' ? {
              root: 'root',
              trunk: ['root', 'branch1'],
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
            const actlData: SemTree | string = create('root', content, opts);
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
              'semtree.create(): indentation found in non-root file "branch1". This may lead to unexpected results.\n'
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
            const actlData: SemTree | string = create('root', content, opts);
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

          it.skip('indentSize', () => {
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

          const testErrorMultiFile = (description: string, root: string, content: Record<string, string>, error: string) => {
            it(description, () => {
              const actl: SemTree | string = create(root, content, opts);
              const expd: string = error;
              assert.strictEqual(actl, expd);
            });
          };

          testErrorMultiFile('inconsistent indentation',
            'root',
            {
              'root':
`- [[child1a]]
  - [[grandchild1a]]
     - [[branch]]
`,
              'branch':
`- [[child1b]]
`,
            },
            'semtree.lint(): improper indentation found:\n\n- File "root" Line 3 (inconsistent indentation): "     - [[branch]]"\n',
          );

          testErrorMultiFile('cycle; self; branch',
            'root', {
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
            `semtree.lint(): duplicate entity names found:

- File "branch" Line 1: "branch"
`,
          );

          testErrorMultiFile('cycle; cross-file; root',
            'root', {
              'root':
`- [[child1a]]
  - [[grandchild1a]]
- [[branch]]
`,
              'branch':
`- [[root]]
`},
            'semtree.build(): cycle detected involving node "root"',
          );

          testErrorMultiFile('cycle; cross-file; branch',
            'root', {
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
`
            },
            `semtree.lint(): duplicate entity names found:

- File "branch2" Line 1: "branch1"
`,
          );

          testErrorMultiFile('cycle; self; root',
            'root', {
              'root':
`- [[root]]
  - [[child1a]]
    - [[grandchild1a]]
      - [[branch]]
`,
              'branch':
`- [[child1b]]
`,
            },
            'semtree.build(): cycle detected involving node "root"',
          );

        });

      });

    });

  });

});
