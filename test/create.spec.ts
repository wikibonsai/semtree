import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTree, SemTreeOpts } from '../src/lib/types';
import { create } from '../src/lib/create';


describe('create()', () => {

  let fakeConsoleWarn: sinon.SinonSpy;
  let concreteData: SemTree;
  let virtualData: SemTree;
  let opts: SemTreeOpts;

  beforeEach(() => {
    console.warn = (msg) => msg + '\n';
    fakeConsoleWarn = sinon.spy(console, 'warn');
  });

  afterEach(() => {
    fakeConsoleWarn.restore();
  });

  ['concrete', 'virtual'].forEach((trunkType) => {

    describe(`${trunkType} trunk`, () => {

      beforeEach(() => {
        opts = {
          virtualTrunk: (trunkType === 'virtual'),
        };
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
          orphans: [],
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
          orphans: [],
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
      });

      it('empty input', () => {
        assert.deepStrictEqual(
          create('', {}, opts),
          'semtree.build(): no content provided',
        );
      });

      describe('single file', () => {

        it(`${trunkType} trunk; single file; indentation; 2 spaces (default)`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; indentation; 3 spaces`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
   - [[grandchild1]]
   - [[grandchild2]]
      - [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, { ...opts, indentSize: 3 });
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; indentation; 4 spaces`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
    - [[grandchild1]]
    - [[grandchild2]]
        - [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, { ...opts, indentSize: 4 });
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; indentation; 1 tab`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
\t- [[grandchild1]]
\t- [[grandchild2]]
\t\t- [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, { ...opts, indentKind: 'tab', indentSize: 1 });
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; indentation; 2 tabs`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
\t\t- [[grandchild1]]
\t\t- [[grandchild2]]
\t\t\t\t- [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, { ...opts, indentKind: 'tab', indentSize: 2 });
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; extra newlines; strip leading newlines`, () => {
          const content: Record<string,string> = {
            'root':
`


- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; extra newlines; strip trailing newlines`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
    - [[greatgrandchild1]]


`
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; accept different markdown list styles`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
  * [[grandchild1]]
  * [[grandchild2]]
    + [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; options; mkdnList: false`, () => {
          const content: Record<string,string> = {
            'root':
`[[child1]]
  [[grandchild1]]
  [[grandchild2]]
    [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, { ...opts, mkdnList: false });
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; options; wikitext: false`, () => {
          const content: Record<string,string> = {
            'root':
`- child1
  - grandchild1
  - grandchild2
    - greatgrandchild1
`
          };
          const actl: SemTree | string = create('root', content, { ...opts, wikitext: false });
          const expd: SemTree = (trunkType === 'concrete') ? concreteData : virtualData;
          assert.deepStrictEqual(actl, expd);
        });

        it(`${trunkType} trunk; single file; skips HTML comments`, () => {
          const content: Record<string,string> = {
            'root':
`<!-- this is a comment and should be ignored -->
- [[child1]]
  <!-- nested comment -->
                                    <!-- deeply nested comment -->
  - [[grandchild1]]
`
          };
          const actlData: SemTree | string = create('root', content, opts);
          const expdData: SemTree = (trunkType === 'concrete') ? {
            root: 'root',
            trunk: ['root'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
              'grandchild1': 'root',
            },
            orphans: [],
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1'],
              },{
                text: 'child1',
                ancestors: ['root'],
                children: ['grandchild1'],
              },{
                text: 'grandchild1',
                ancestors: ['root', 'child1'],
                children: [],
              },
            ]
          } : {
            root: 'child1',
            trunk: [],
            petioleMap: {},
            orphans: [],
            nodes: [
              {
                text: 'child1',
                ancestors: [],
                children: ['grandchild1'],
              },{
                text: 'grandchild1',
                ancestors: ['child1'],
                children: [],
              },
            ]
          };
          assert.deepStrictEqual(actlData, expdData);
        });

        describe('option functions', () => {

          let spyGraft: sinon.SinonSpy;
          let spyPrune: sinon.SinonSpy;
          let opts: SemTreeOpts;
          let initialTree: SemTree;
        
          beforeEach(() => {
            spyGraft = sinon.spy();
            spyPrune = sinon.spy();
            opts = {
              graft: spyGraft,
              prune: spyPrune,
            };
            initialTree = {
              root: 'root',
              trunk: ['root'],
              petioleMap: {
                'root': 'root',
                'child1': 'root',
                'grandchild1': 'root',
                'grandchild2': 'root',
                'child2': 'root',
              },
              orphans: [],
              nodes: [
                {
                  text: 'root',
                  ancestors: [],
                  children: ['child1', 'child2'],
                },
                {
                  text: 'child1',
                  ancestors: ['root'],
                  children: ['grandchild1', 'grandchild2'],
                },
                {
                  text: 'grandchild1',
                  ancestors: ['root', 'child1'],
                  children: [],
                },
                {
                  text: 'grandchild2',
                  ancestors: ['root', 'child1'],
                  children: [],
                },
                {
                  text: 'child2',
                  ancestors: ['root'],
                  children: [],
                },
              ],
            };
          });

          it(`${trunkType} trunk; single file; options; graft`, () => {
            // setup
            const content = {
              'root': `
- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
- [[child2]]
`
            };
            // go
            const result = create('root', content, opts);
            // assert
            assert(result instanceof Object);
            assert.equal(spyGraft.callCount, 4);
            assert(spyGraft.calledWith('root', 'child1'));
            assert(spyGraft.calledWith('child1', 'grandchild1'));
            assert(spyGraft.calledWith('child1', 'grandchild2'));
            assert(spyGraft.calledWith('root', 'child2'));
            assert.equal(spyPrune.callCount, 0);
          });

          it(`${trunkType} trunk; single file; options; graft; should not call for root node`, () => {
            // setup
            const content = {
              'root': `
- [[child1]]
`
            };
            // go
            const result = create('root', content, opts);
            // assert
            assert(result instanceof Object);
            assert.equal(spyGraft.callCount, 1);
            assert(spyGraft.calledWith('root', 'child1'));
            assert.equal(spyPrune.callCount, 0);
          });

        });

      });

      it(`${trunkType} trunk; single file; error handling; inconsistent indentation`, () => {
        const content: Record<string,string> = {
          'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
     - [[greatgrandchild1]]
`
        };
        const actl: SemTree | string = create('root', content, opts);
        const expd: string = 'semtree.lint(): improper indentation found:\n\n- File "root" Line 4 (inconsistent indentation): "     - [[greatgrandchild1]]"\n';
        assert.strictEqual(actl, expd);
      });

      it(`${trunkType} trunk; single file; error handling; duplicate text`, () => {
        const content: Record<string,string> = {
          'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`
        };
        const actl: SemTree | string = create('root', content, opts);
        const expd: string =
`semtree.lint(): duplicate entity names found:

- "grandchild2"
  - File "root" Line 3
  - File "root" Line 4
`;
        assert.strictEqual(actl, expd);
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
            orphans: [],
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
            orphans: [],
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

        it(`${trunkType} trunk; multi file; two files`, () => {
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

        it(`${trunkType} trunk; multi file; three files`, () => {
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
            orphans: [],
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
            orphans: [],
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

        it(`${trunkType} trunk; multi file; unprocessed trunk files added to 'orphans'`, () => {
          const content: Record<string, string> = {
            'root':
`- [[child1]]
`,
            'child1':
`- [[grandchild1]]
`,
            'unused-file1':
`- [[unused-child1]]
`,
            'unused-file2':
`- [[unused-child2]]
`,
          };
          
          const actlData: SemTree | string = create('root', content, opts);
          const expdData: SemTree = trunkType === 'concrete' ? {
            root: 'root',
            trunk: ['root', 'child1'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
              'grandchild1': 'child1',
            },
            orphans: ['unused-file1', 'unused-file2'],
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1'],
              },{
                text: 'child1',
                ancestors: ['root'],
                children: ['grandchild1'],
              },{
                text: 'grandchild1',
                ancestors: ['root', 'child1'],
                children: [],
              }
            ]
          } : {
            root: 'grandchild1',
            trunk: [],
            petioleMap: {},
            orphans: [],
            nodes: [
              {
                text: 'grandchild1',
                ancestors: [],
                children: [],
              }
            ]
          };
          
          if (typeof actlData === 'string') {
            assert.fail(`Expected SemTree object, but got error string: ${actlData}`);
          } else {
            assert.deepStrictEqual(actlData, expdData);
          }
        });

        it(`${trunkType} trunk; multi file; deep backtracking`, () => {
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
            orphans: [],
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
            orphans: [],
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

        it(`${trunkType} trunk; multi file; deep backtracking to 0-level`, () => {
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
            orphans: [],
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

        it(`${trunkType} trunk; multi file; indentation not on root file`, () => {
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
            orphans: [],
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
            orphans: [],
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

        it(`${trunkType} trunk; multi file; root file's root node is a branch file`, () => {
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
          const expdData: SemTree | string = trunkType === 'concrete' ? {
            root: 'root',
            trunk: ['root', 'branch1'],
            petioleMap: {
              'root': 'root',
              'branch1': 'root',
              'child1b': 'branch1',
              'child2b': 'branch1',
            },
            orphans: [],
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['branch1'],
              },{
                text: 'branch1',
                ancestors: ['root'],
                children: ['child1b', 'child2b'],
              },{
                text: 'child1b',
                ancestors: ['root', 'branch1'],
                children: [],
              },{
                text: 'child2b',
                ancestors: ['root', 'branch1'],
                children: [],
              },
            ]
          } : 'semtree.build(): cannot have multiple root nodes, node "child2b" at same level as root node "child1b"';
          assert.deepStrictEqual(actlData, expdData);
        });

        it(`${trunkType} trunk; multi file; path only contains branch index files`, () => {
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
            trunk: ['root', 'branch1', 'branch2'],
            petioleMap: {
              'root': 'root',
              'branch1': 'root',
              'branch2': 'branch1',
              'child1c': 'branch2',
            },
            orphans: [],
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
            orphans: [],
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

        // orphan trunk files

        it(`${trunkType} trunk; multi file; orphan trunk file`, () => {
          // setup
          const content: Record<string, string> = {
            'root':
`- [[child1]]
`,
            'child1':
`- [[grandchild1]]
`,
            'unused-file':
`- [[unused-child]]
`,
          };
          const actlResult: SemTree | string = create('root', content, opts);
          const expdResult: SemTree = trunkType === 'concrete' ? {
            root: 'root',
            trunk: ['root', 'child1'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
              'grandchild1': 'child1',
            },
            orphans: ['unused-file'],
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1'],
              },{
                text: 'child1',
                ancestors: ['root'],
                children: ['grandchild1'],
              },{
                text: 'grandchild1',
                ancestors: ['root', 'child1'],
                children: [],
              }
            ]
          } : {
            root: 'grandchild1',
            trunk: [],
            petioleMap: {},
            orphans: [],
            nodes: [
              {
                text: 'grandchild1',
                ancestors: [],
                children: [],
              }
            ]
          };
          assert.deepStrictEqual(actlResult, expdResult);
        });

        // error handling

        it(`${trunkType} trunk; multi file; error handling; cycle; self; root`, () => {
          const content: Record<string, string> = {
            'root':
`- [[root]]
- [[child1a]]
- [[grandchild1a]]
- [[branch]]
`,
            'branch':
`- [[child1b]]
`,
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: string = 'semtree.checkDuplicates(): cycle detected involving node "root"';
          assert.strictEqual(actl, expd);
        });

        it(`${trunkType} trunk; multi file; error handling; cycle; cross-file; root`, () => {
          const content: Record<string, string> = {
            'root':
`- [[child1a]]
  - [[grandchild1a]]
- [[branch]]
`,
            'branch':
`- [[root]]
`
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: string = 'semtree.checkDuplicates(): cycle detected involving node "root"';
          assert.strictEqual(actl, expd);
        });

        it(`${trunkType} trunk; multi file; error handling; cycle; cross-file; branch`, () => {
          const content: Record<string, string> = {
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
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: string = `semtree.lint(): duplicate entity names found:

- "branch1"
  - File "root" Line 3
  - File "branch2" Line 1
`;
          assert.strictEqual(actl, expd);
        });

        it(`${trunkType} trunk; multi file; error handling; inconsistent indentation`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
     - [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: string = 'semtree.lint(): improper indentation found:\n\n- File "root" Line 4 (inconsistent indentation): "     - [[greatgrandchild1]]"\n';
          assert.strictEqual(actl, expd);
        });

        it(`${trunkType} trunk; multi file; error handling; duplicate text`, () => {
          const content: Record<string,string> = {
            'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
  - [[grandchild2]]
    - [[greatgrandchild1]]
`
          };
          const actl: SemTree | string = create('root', content, opts);
          const expd: string = `semtree.lint(): duplicate entity names found:

- "grandchild2"
  - File "root" Line 3
  - File "root" Line 4
`;
          assert.strictEqual(actl, expd);
        });

        it(`${trunkType} trunk; multi file; error handling; no root-level entry in virtual trunk mode`, () => {
          if (trunkType === 'virtual') {
            const content: Record<string,string> = {
              'root':
`- [[child1]]
- [[child2]]
`
            };
            const actl: SemTree | string = create('root', content, opts);
            const expd: string = 'semtree.build(): cannot have multiple root nodes, node "child2" at same level as root node "child1"';
            assert.strictEqual(actl, expd);
          }
        });

      });

    });

  });

});
