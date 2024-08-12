import assert from 'node:assert/strict';

import type { SemTree, SemTreeOpts, TreeNode } from '../src/lib/types';
import { update } from '../src/lib/update';


let opts: SemTreeOpts;

describe('update()', () => {

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
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['branch2'],
            },{
              text: 'branch2',
              ancestors: ['root', 'child1a', 'branch1'],
              children: ['child1c'],
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
            },{
              text: 'child1c',
              ancestors: ['root', 'child1a', 'branch1', 'branch2'],
              children: [],
            }
          ]
        };
        const replacement: string = 
`- [[child1c]]
  - [[newChild]]
`;
        // subtree                               // go
        const actlSubTree: TreeNode[] | string = update(tree, 'branch2', { 'branch2': replacement }, opts);
        const expdSubTree: TreeNode[] = [
          {
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newChild'],
          },{
            text: 'newChild',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: [],
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
          },{
            text: 'child1a',
            ancestors: ['root'],
            children: ['branch1', 'grandchild1a'],
          },{
            text: 'branch1',
            ancestors: ['root', 'child1a'],
            children: ['branch2'],
          },{
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
          },{
            text: 'grandchild1a',
            ancestors: ['root', 'child1a'],
            children: [],
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newChild'],
          },{
            text: 'newChild',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: [],
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
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['branch2'],
            },{
              text: 'branch2',
              ancestors: ['root', 'child1a', 'branch1'],
              children: ['child1c'],
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
            },{
              text: 'child1c',
              ancestors: ['root', 'child1a', 'branch1', 'branch2'],
              children: [],
            },{
              text: 'removeThisChild',
              ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
              children: [],
            }
          ]
        };
        const replacement: string = 
`- [[child1c]]
`;
        // returned subtree                      // go
        const actlSubTree: TreeNode[] | string = update(tree, 'branch2', { 'branch2': replacement }, opts);
        const expdSubTree: TreeNode[] = [
          {
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: [],
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
          },{
            text: 'child1a',
            ancestors: ['root'],
            children: ['branch1', 'grandchild1a'],
          },{
            text: 'branch1',
            ancestors: ['root', 'child1a'],
            children: ['branch2'],
          },{
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
          },{
            text: 'grandchild1a',
            ancestors: ['root', 'child1a'],
            children: [],
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: [],
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
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['branch2'],
            },{
              text: 'branch2',
              ancestors: ['root', 'child1a', 'branch1'],
              children: ['child1c'],
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
            },{
              text: 'child1c',
              ancestors: ['root', 'child1a', 'branch1', 'branch2'],
              children: [],
            },{
              text: 'removeThisChild',
              ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
              children: [],
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
        const actlSubTree: TreeNode[] | string = update(tree, 'branch2', replacement, opts);
        const expdSubTree: TreeNode[] = [
          {
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newbranch'],
          },{
            text: 'newbranch',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: ['child1d'],
          },{
            text: 'child1d',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c', 'newbranch'],
            children: [],
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
          },{
            text: 'child1a',
            ancestors: ['root'],
            children: ['branch1', 'grandchild1a'],
          },{
            text: 'branch1',
            ancestors: ['root', 'child1a'],
            children: ['branch2'],
          },{
            text: 'branch2',
            ancestors: ['root', 'child1a', 'branch1'],
            children: ['child1c'],
          },{
            text: 'grandchild1a',
            ancestors: ['root', 'child1a'],
            children: [],
          },{
            text: 'child1c',
            ancestors: ['root', 'child1a', 'branch1', 'branch2'],
            children: ['newbranch'],
          },{
            text: 'newbranch',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
            children: ['child1d'],
          },{
            text: 'child1d',
            ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c', 'newbranch'],
            children: [],
          },
        ];
        assert.deepEqual(actlTree, expdTree);
      });

      describe('option', () => {

        it('lvlSize (this needs to be set, esp. in the scenario update content does not contain indentation)', () => {
          // setup
          const tree: SemTree = {
            root: 'root',
            trunk: ['root'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
            },
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1'],
              },{
                text: 'child1',
                ancestors: ['root'],
                children: [],
              }
            ]
          };
          const replacement: string = 
`[[child1]]
[[newChild1]]
[[newChild2]]`;
          // subtree                               // go
          const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, { ...opts, lvlSize: 1 });
          const expdSubTree: TreeNode[] = [
            {
              text: 'root',
              ancestors: [],
              children: ['child1', 'newChild1', 'newChild2'],
            },{
              text: 'child1',
              ancestors: ['root'],
              children: [],
            },{
              text: 'newChild1',
              ancestors: ['root'],
              children: [],
            },{
              text: 'newChild2',
              ancestors: ['root'],
              children: [],
            }
          ];
          assert.deepEqual(actlSubTree, expdSubTree);
        });

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
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: ['branch1', 'grandchild1a'],
              },{
                text: 'branch1',
                ancestors: ['root', 'child1a'],
                children: ['branch2'],
              },{
                text: 'branch2',
                ancestors: ['root', 'child1a', 'branch1'],
                children: ['child1c'],
              },{
                text: 'grandchild1a',
                ancestors: ['root', 'child1a'],
                children: [],
              },{
                text: 'child1c',
                ancestors: ['root', 'child1a', 'branch1', 'branch2'],
                children: [],
              },{
                text: 'removeThisChild',
                ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
                children: [],
              }
            ]
          };
          const replacement: string = 
`- [[child1b]]
`;
          // subtree                               // go
          const actlSubTree: TreeNode[] | string = update(tree, 'branch1', { 'branch1': replacement }, opts);
          const expdSubTree: TreeNode[] = [
            {
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['child1b'],
            },{
              text: 'child1b',
              ancestors: ['root', 'child1a', 'branch1'],
              children: [],
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
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['branch1', 'grandchild1a'],
            },{
              text: 'branch1',
              ancestors: ['root', 'child1a'],
              children: ['child1b'],
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
            },{
              text: 'child1b',
              ancestors: ['root', 'child1a', 'branch1'],
              children: [],
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
              },{
                text: 'child1a',
                ancestors: ['root'],
                children: ['branch1', 'grandchild1a'],
              },{
                text: 'branch1',
                ancestors: ['root', 'child1a'],
                children: ['branch2'],
              },{
                text: 'branch2',
                ancestors: ['root', 'child1a', 'branch1'],
                children: ['child1c'],
              },{
                text: 'grandchild1a',
                ancestors: ['root', 'child1a'],
                children: [],
              },{
                text: 'child1c',
                ancestors: ['root', 'child1a', 'branch1', 'branch2'],
                children: [],
              },{
                text: 'removeThisChild',
                ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
                children: [],
              }
            ]
          };
          const replacement: string =
`- [[child1a]]
  - [[grandchild1a]]
`;
          // subtree                               // go
          const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, opts);
          const expdSubTree: TreeNode[] = [
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
              children: [],
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
            },{
              text: 'child1a',
              ancestors: ['root'],
              children: ['grandchild1a'],
            },{
              text: 'grandchild1a',
              ancestors: ['root', 'child1a'],
              children: [],
            }
          ];
          assert.deepEqual(actlTree, expdTree);
        });

      });

      describe('options', () => {

        it('lvlSize', () => {
          const tree: SemTree = {
            root: 'root',
            trunk: ['root'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
            },
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1'],
              },{
                text: 'child1',
                ancestors: ['root'],
                children: [],
              }
            ]
          };
          const replacement: string = 
`- [[child1]]
  - [[newChild1]]
  - [[newChild2]]
`;
          const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, { ...opts, lvlSize: 2 });
          const expdSubTree: TreeNode[] = [
            {
              text: 'root',
              ancestors: [],
              children: ['child1'],
            },{
              text: 'child1',
              ancestors: ['root'],
              children: ['newChild1', 'newChild2'],
            },{
              text: 'newChild1',
              ancestors: ['root', 'child1'],
              children: [],
            },{
              text: 'newChild2',
              ancestors: ['root', 'child1'],
              children: [],
            }
          ];
          assert.deepEqual(actlSubTree, expdSubTree);
        });

        it('mkdnList: false', () => {
          const tree: SemTree = {
            root: 'root',
            trunk: ['root'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
            },
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1'],
              },{
                text: 'child1',
                ancestors: ['root'],
                children: [],
              }
            ]
          };
          const replacement: string = 
`* [[child1]]
  + [[newChild]]
`;
          const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, { ...opts, mkdnList: true });
          const expdSubTree: TreeNode[] = [
            {
              text: 'root',
              ancestors: [],
              children: ['child1'],
            },{
              text: 'child1',
              ancestors: ['root'],
              children: ['newChild'],
            },{
              text: 'newChild',
              ancestors: ['root', 'child1'],
              children: [],
            }
          ];
          assert.deepEqual(actlSubTree, expdSubTree);
        });
  
        it('wikitext: false', () => {
          const tree: SemTree = {
            root: 'root',
            trunk: ['root'],
            petioleMap: {
              'root': 'root',
              'child1': 'root',
            },
            nodes: [
              {
                text: 'root',
                ancestors: [],
                children: ['child1'],
              },{
                text: 'child1',
                ancestors: ['root'],
                children: [],
              }
            ]
          };
          const replacement: string = 
`- child1
  - newChild
`;
          const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, { ...opts, wikitext: false });
          const expdSubTree: TreeNode[] = [
            {
              text: 'root',
              ancestors: [],
              children: ['child1'],
            },{
              text: 'child1',
              ancestors: ['root'],
              children: ['newChild'],
            },{
              text: 'newChild',
              ancestors: ['root', 'child1'],
              children: [],
            }
          ];
          assert.deepEqual(actlSubTree, expdSubTree);
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
              'branch2': 'branch1',
              'grandchild1a': 'root',
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
                children: ['branch1', 'grandchild1a'],
              },{
                text: 'branch1',
                ancestors: ['root', 'child1a'],
                children: ['branch2'],
              },{
                text: 'branch2',
                ancestors: ['root', 'child1a', 'branch1'],
                children: ['child1c'],
              },{
                text: 'grandchild1a',
                ancestors: ['root', 'child1a'],
                children: [],
              },{
                text: 'child1c',
                ancestors: ['root', 'child1a', 'branch1', 'branch2'],
                children: [],
              },{
                text: 'removeThisChild',
                ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'],
                children: [],
              }
            ]
          };
          // go
          assert.strictEqual(
            update(tree, 'missing', { 'missing': '- [[newnode]]' }, opts),
            'semtree.update(): subroot not found in the tree: "missing"',
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
