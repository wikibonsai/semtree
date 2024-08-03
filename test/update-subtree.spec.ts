import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTree, SemTreeOpts, TreeNode } from '../src/lib/types';
import { updateSubTree } from '../src/lib/update-subtree';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let opts: SemTreeOpts;

describe('updateSubTree()', () => {

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

    beforeEach(() => {
      opts = {
        virtualTrunk: false,
      };
    });

    describe('single file replacement', () => {

      it('add leaf', () => {
        // setup
        const content: Record<string,string> = {
          'root':
`- [[child1a]]
  - [[branch1]]
  - [[grandchild1a]]
`,
          'branch1':
`- [[branch2]]
`,
          'branch2':
`- [[child1c]]
`};
        const tree: SemTree = {
          root: 'root',
          trunk: ['root', 'branch1', 'branch2'],
          petioleMap: {
            'root': 'root',
            'branch1': 'root',
            'branch2': 'branch2',
            'grandchild1a': 'root',
            'child1a': 'root',
            'child1c': 'branch2',
          },
          nodes: [
            {
              text: 'root',
              ancestors: [],
              children: ['child1a'],
              isRoot: true,
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
              isRoot: false,
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['branch2'],
              isRoot: false,
            },{
              text: 'branch2',
              ancestors: ['root', 'child1a', 'branch1'],
              children: ['child1c'],
              isRoot: false,
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
              isRoot: false,
            },{
              text: 'child1c',
              ancestors: ['root', 'child1a', 'branch1', 'branch2'],
              children: [],
              isRoot: false,
            }
          ]
        };
        const replacement: string = 
`- [[child1c]]
  - [[newChild]]
`;
        // subtree                               // go
        const actlSubTree: TreeNode[] | string = updateSubTree(tree, { 'branch2': replacement }, 'branch2');
        const expdSubTree: TreeNode[] = [
          {
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
            isRoot: false,
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newChild'],
            isRoot: false,
          },{
            text: 'newChild',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: [],
            isRoot: false,
          }
        ];
        assert.deepEqual(actlSubTree, expdSubTree);
        // final updated tree
        const actlTree: TreeNode[] = tree.nodes;
        const expdTree: TreeNode[] = [
          {
            text: 'root',
            ancestors: [],
            children: ['child1a'],
            isRoot: true,
          },{
            text: 'child1a',
            ancestors: ['root'],
            children: ['branch1', 'grandchild1a'],
            isRoot: false,
          },{
            text: 'branch1',
            ancestors: ['root', 'child1a'],
            children: ['branch2'],
            isRoot: false,
          },{
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
            isRoot: false,
          },{
            text: 'grandchild1a',
            ancestors: ['root', 'child1a'],
            children: [],
            isRoot: false,
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newChild'],
            isRoot: false,
          },{
            text: 'newChild',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: [],
            isRoot: false,
          }
        ];
        assert.deepEqual(actlTree, expdTree);
      });

      it('remove leaf', () => {
        // setup
        const content: Record<string,string> = {
          'root':
`- [[child1a]]
  - [[branch1]]
  - [[grandchild1a]]
`,
          'branch1':
`- [[branch2]]
`,
          'branch2':
`- [[child1c]]
  - [[removeThisChild]]
`};
        const tree: SemTree = {
          root: 'root',
          trunk: ['root', 'branch1', 'branch2'],
          petioleMap: {
            'root': 'root',
            'branch1': 'root',
            'branch2': 'branch2',
            'grandchild1a': 'root',
            'child1a': 'root',
            'child1c': 'branch2',
          },
          nodes: [
            {
              text: 'root',
              ancestors: [],
              children: ['child1a'],
              isRoot: true,
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
              isRoot: false,
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['branch2'],
              isRoot: false,
            },{
              text: 'branch2',
              ancestors: ['root', 'child1a', 'branch1'],
              children: ['child1c'],
              isRoot: false,
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
              isRoot: false,
            },{
              text: 'child1c',
              ancestors: ['root', 'child1a', 'branch1', 'branch2'],
              children: [],
              isRoot: false,
            },{
              text: 'removeThisChild',
              ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
              children: [],
              isRoot: false,
            }
          ]
        };
        const replacement: string = 
`- [[child1c]]
`;
        // returned subtree                      // go
        const actlSubTree: TreeNode[] | string = updateSubTree(tree, { 'branch2': replacement }, 'branch2');
        const expdSubTree: TreeNode[] = [
          {
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
            isRoot: false,
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: [],
            isRoot: false,
          },
        ];
        assert.deepEqual(actlSubTree, expdSubTree);
        // final updated tree
        const actlTree: TreeNode[] = tree.nodes;
        const expdTree: TreeNode[] = [
          {
            text: 'root',
            ancestors: [],
            children: ['child1a'],
            isRoot: true,
          },{
            text: 'child1a',
            ancestors: ['root'],
            children: ['branch1', 'grandchild1a'],
            isRoot: false,
          },{
            text: 'branch1',
            ancestors: ['root', 'child1a'],
            children: ['branch2'],
            isRoot: false,
          },{
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
            isRoot: false,
          },{
            text: 'grandchild1a',
            ancestors: ['root', 'child1a'],
            children: [],
            isRoot: false,
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: [],
            isRoot: false,
          },
        ];
        assert.deepEqual(actlTree, expdTree);
      });

      it('add trunk', () => {
        // setup
        const content: Record<string,string> = {
          'root':
`- [[child1a]]
  - [[branch1]]
  - [[grandchild1a]]
`,
          'branch1':
`- [[branch2]]
`,
          'branch2':
`- [[child1c]]
`};
        const tree: SemTree = {
          root: 'root',
          trunk: ['root', 'branch1', 'branch2'],
          petioleMap: {
            'root': 'root',
            'branch1': 'root',
            'branch2': 'branch2',
            'grandchild1a': 'root',
            'child1a': 'root',
            'child1c': 'branch2',
          },
          nodes: [
            {
              text: 'root',
              ancestors: [],
              children: ['child1a'],
              isRoot: true,
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
              isRoot: false,
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['branch2'],
              isRoot: false,
            },{
              text: 'branch2',
              ancestors: ['root', 'child1a', 'branch1'],
              children: ['child1c'],
              isRoot: false,
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
              isRoot: false,
            },{
              text: 'child1c',
              ancestors: ['root', 'child1a', 'branch1', 'branch2'],
              children: [],
              isRoot: false,
            },{
              text: 'removeThisChild',
              ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
              children: [],
              isRoot: false,
            }
          ]
        };
        const replacement: Record<string, string> = {
          'branch2':
`- [[child1c]]
  - [[newbranch]]
`,
          'newbranch':
`- [[child1d]]
`
        };
        // returned subtree                      // go
        const actlSubTree: TreeNode[] | string = updateSubTree(tree, replacement, 'branch2');
        const expdSubTree: TreeNode[] = [
          {
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
            isRoot: false,
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newbranch'],
            isRoot: false,
          },{
            text: 'newbranch',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: ['child1d'],
            isRoot: false,
          },
          // todo: shouldn't this be included?
          // {
          //   text: 'child1d',
          //   ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c', 'newbranch'],
          //   children: [],
          //   isRoot: false,
          // },
        ];
        assert.deepEqual(actlSubTree, expdSubTree);
        // final updated tree
        const actlTree: TreeNode[] = tree.nodes;
        const expdTree: TreeNode[] = [
          {
            text: 'root',
            ancestors: [],
            children: ['child1a'],
            isRoot: true,
          },{
            text: 'child1a',
            ancestors: ['root'],
            children: ['branch1', 'grandchild1a'],
            isRoot: false,
          },{
            text: 'branch1',
            ancestors: ['root', 'child1a'],
            children: ['branch2'],
            isRoot: false,
          },{
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
            isRoot: false,
          },{
            text: 'grandchild1a',
            ancestors: ['root', 'child1a'],
            children: [],
            isRoot: false,
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newbranch'],
            isRoot: false,
          },{
            text: 'newbranch',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: ['child1d'],
            isRoot: false,
          },{
            text: 'child1d',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c', 'newbranch'],
            children: [],
            isRoot: false,
          },
        ];
        assert.deepEqual(actlTree, expdTree);
      });

    });

    describe('multi file replacement', () => {

      describe('remove trunk', () => {

        it('clean (only removing a single branch)', () => {
          // setup
          const content: Record<string,string> = {
            'root':
`- [[child1a]]
  - [[branch1]]
  - [[grandchild1a]]
`,
            'branch1':
`- [[branch2]]
`,
            'branch2':
`- [[child1c]]
`};
          const tree: SemTree = {
            root: 'root',
            trunk: ['root', 'branch1', 'branch2'],
            petioleMap: {
              'root': 'root',
              'branch1': 'root',
              'branch2': 'branch1',
              'grandchild1a': 'root',
              'child1a': 'root',
              'child1c': 'branch2',
            },
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1a'],
                isRoot: true,
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: ['branch1', 'grandchild1a'],
                isRoot: false,
              },{
                text: 'branch1',
                ancestors: ['root', 'child1a'],
                children: ['branch2'],
                isRoot: false,
              },{
                text: 'branch2',
                ancestors: ['root', 'child1a', 'branch1'],
                children: ['child1c'],
                isRoot: false,
              },{
                text: 'grandchild1a',
                ancestors: ['root', 'child1a'],
                children: [],
                isRoot: false,
              },{
                text: 'child1c',
                ancestors: ['root', 'child1a', 'branch1', 'branch2'],
                children: [],
                isRoot: false,
              },{
                text: 'removeThisChild',
                ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
                children: [],
                isRoot: false,
              }
            ]
          };
          const replacement: string = 
`- [[child1b]]
`;
          // subtree                               // go
          const actlSubTree: TreeNode[] | string = updateSubTree(tree, { 'branch1': replacement }, 'branch1');
          const expdSubTree: TreeNode[] = [
            {
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['child1b'],
              isRoot: false,
            },{
              text: 'child1b',
              ancestors: ['root', 'child1a', 'branch1'],
              children: [],
              isRoot: false,
            }
          ];
          assert.deepEqual(actlSubTree, expdSubTree);
          // final updated tree
          const actlTree: TreeNode[] = tree.nodes;
          const expdTree: TreeNode[] = [
            {
              text: 'root',
              ancestors: [],
              children: ['child1a'],
              isRoot: true,
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
              isRoot: false,
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['child1b'],
              isRoot: false,
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
              isRoot: false,
            },{
              text: 'child1b',
              ancestors: ['root', 'child1a', 'branch1'],
              children: [],
              isRoot: false,
            }
          ];
          assert.deepEqual(actlTree, expdTree);
        });

        it('with remaining dead branch (not mentioned explicitly in update but is effected); (this is also the root case)', () => {
          // setup
          const content: Record<string,string> = {
            'root':
`- [[child1a]]
  - [[branch1]]
  - [[grandchild1a]]
`,
            'branch1':
`- [[branch2]]
`,
            'branch2':
`- [[child1c]]
`};
          const tree: SemTree = {
            root: 'root',
            trunk: ['root', 'branch1', 'branch2'],
            petioleMap: {
              'root': 'root',
              'branch1': 'root',
              'branch2': 'branch2',
              'grandchild1a': 'root',
              'child1a': 'root',
              'child1c': 'branch2',
            },
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1a'],
                isRoot: true,
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: ['branch1', 'grandchild1a'],
                isRoot: false,
              },{
                text: 'branch1',
                ancestors: ['root', 'child1a'],
                children: ['branch2'],
                isRoot: false,
              },{
                text: 'branch2',
                ancestors: ['root', 'child1a', 'branch1'],
                children: ['child1c'],
                isRoot: false,
              },{
                text: 'grandchild1a',
                ancestors: ['root', 'child1a'],
                children: [],
                isRoot: false,
              },{
                text: 'child1c',
                ancestors: ['root', 'child1a', 'branch1', 'branch2'],
                children: [],
                isRoot: false,
              },{
                text: 'removeThisChild',
                ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
                children: [],
                isRoot: false,
              }
            ]
          };
          const replacement: string =
`- [[child1a]]
  - [[grandchild1a]]
`;
          // subtree                               // go
          const actlSubTree: TreeNode[] | string = updateSubTree(tree, { 'root': replacement }, 'root');
          const expdSubTree: TreeNode[] = [
            {
              text: 'root',
              ancestors: [],
              children: ['child1a'],
              isRoot: true,
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['grandchild1a'],
              isRoot: false,
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
              isRoot: false,
            }
          ];
          assert.deepEqual(actlSubTree, expdSubTree);
          // final updated tree
          const actlTree: TreeNode[] = tree.nodes;
          const expdTree: TreeNode[] = [
            {
              text: 'root',
              ancestors: [],
              children: ['child1a'],
              isRoot: true,
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['grandchild1a'],
              isRoot: false,
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
              isRoot: false,
            }
          ];
          assert.deepEqual(actlTree, expdTree);
        });

      });

      describe('error', () => {

        it('missing subtree', () => {
          // setup
          const content: Record<string,string> = {
            'root':
  `- [[child1a]]
    - [[branch1]]
    - [[grandchild1a]]
  `,
            'branch1':
  `- [[branch2]]
  `,
            'branch2':
  `- [[child1c]]
  `};
          const tree: SemTree = {
            root: 'root',
            trunk: ['root', 'branch1', 'branch2'],
            petioleMap: {
              'root': 'root',
              'branch1': 'root',
              'branch2': 'branch2',
              'grandchild1a': 'root',
              'child1c': 'branch2',
            },
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1a'],
                isRoot: true,
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: ['branch1', 'grandchild1a'],
                isRoot: false,
              },{
                text: 'branch1',
                ancestors: ['root', 'child1a'],
                children: ['branch2'],
                isRoot: false,
              },{
                text: 'branch2',
                ancestors: ['root', 'child1a', 'branch1'],
                children: ['child1c'],
                isRoot: false,
              },{
                text: 'grandchild1a',
                ancestors: ['root', 'child1a'],
                children: [],
                isRoot: false,
              },{
                text: 'child1c',
                ancestors: ['root', 'child1a', 'branch1', 'branch2'],
                children: [],
                isRoot: false,
              },{
                text: 'removeThisChild',
                ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
                children: [],
                isRoot: false,
              }
            ]
          };
          // go
          assert.strictEqual(
            updateSubTree(tree, { 'missing': '- [[newnode]]' }, 'missing'),
            'semtree.updateSubTree(): subroot not found in the tree: "missing"',
          );
        });

      });

    });

  });

  describe('virtual trunk', () => {

    describe('single file replacement', () => {

      it.skip('test', () => {
        assert.strictEqual(0, 1);
      });

    });

    describe('multi file replacement', () => {

      it.skip('test', () => {
        assert.strictEqual(0, 1);
      });

    });

  });

});