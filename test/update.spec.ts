import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTree, SemTreeOpts, TreeNode } from '../src/lib/types';
import { update } from '../src/lib/update';

describe('update()', () => {
  let opts: SemTreeOpts;

  beforeEach(() => {
    opts = {
      virtualTrunk: false,
    };
  });

  describe('concrete trunk', () => {

    it('concrete trunk; single file; add leaf', () => {
      // setup
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
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1a'] },
          { text: 'child1a', ancestors: ['root'], children: ['branch1', 'grandchild1a'] },
          { text: 'branch1', ancestors: ['root', 'child1a'], children: ['branch2'] },
          { text: 'branch2', ancestors: ['root', 'child1a', 'branch1'], children: ['child1c'] },
          { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
          { text: 'child1c', ancestors: ['root', 'child1a', 'branch1', 'branch2'], children: [] },
        ]
      };
      const replacement: string =  '- [[child1c]]\n'
                                 + '  - [[newChild]]\n';
      // subtree
      const actlSubTree: TreeNode[] | string = update(tree, 'branch2', { 'branch2': replacement }, opts);
      const expdSubTree: TreeNode[] = [
        { text: 'branch2', ancestors: ['root', 'child1a', 'branch1'], children: ['child1c'] },
        { text: 'child1c', ancestors: ['root', 'child1a', 'branch1', 'branch2'], children: ['newChild'] },
        { text: 'newChild', ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'], children: [] },
      ];
      assert.deepEqual(actlSubTree, expdSubTree);
      // final updated tree
      const actlTree: TreeNode[] = tree.nodes;
      const expdTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1a'] },
        { text: 'child1a', ancestors: ['root'], children: ['branch1', 'grandchild1a'] },
        { text: 'branch1', ancestors: ['root', 'child1a'], children: ['branch2'] },
        { text: 'branch2', ancestors: ['root', 'child1a', 'branch1'], children: ['child1c'] },
        { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
        { text: 'child1c', ancestors: ['root', 'child1a', 'branch1', 'branch2'], children: ['newChild'] },
        { text: 'newChild', ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c'], children: [] },
      ];
      assert.deepEqual(actlTree, expdTree);
    });

    it('concrete trunk; single file; add trunk', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
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
            children: [],
          }
        ]
      };
      const replacement: string =  '- [[child1]]\n'
                                 + '  - [[newChild]]\n';
      const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, opts);
      const expdSubTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['newChild'] },
        { text: 'newChild', ancestors: ['root', 'child1'], children: [] },
      ];
      assert.deepEqual(actlSubTree, expdSubTree);
    });

    it('concrete trunk; single file; remove leaf', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
          'grandchild1': 'root',
        },
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: ['grandchild1'] },
          { text: 'grandchild1', ancestors: ['root', 'child1'], children: [] },
        ]
      };
      const replacement: string =  '- [[child1]]\n';
      const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, opts);
      const expdSubTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: [] },
      ];
      assert.deepEqual(actlSubTree, expdSubTree);
    });

    it('concrete trunk; single file; options; indentSize', () => {
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
        },
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: [] },
        ]
      };
      const replacement: string =  '- [[child1]]\n'
                                 + '  - [[newChild1]]\n'
                                 + '  - [[newChild2]]\n';
      const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, { ...opts, indentSize: 2 });
      const expdSubTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['newChild1', 'newChild2'] },
        { text: 'newChild1', ancestors: ['root', 'child1'], children: [] },
        { text: 'newChild2', ancestors: ['root', 'child1'], children: [] },
      ];
      assert.deepEqual(actlSubTree, expdSubTree);
    });

    it('concrete trunk; single file; options; mkdnBullet: false', () => {
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
        },
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: [] },
        ],
      };
      const replacement: string =  '* [[child1]]\n'
                                 + '  + [[newChild]]\n';
      const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, { ...opts, mkdnBullet: true });
      const expdSubTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['newChild'] },
        { text: 'newChild', ancestors: ['root', 'child1'], children: [] },
      ];
      assert.deepEqual(actlSubTree, expdSubTree);
    });

    it('concrete trunk; single file; options; wikilink: false', () => {
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
        },
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: [] },
        ],
      };
      const replacement: string =  '- child1\n'
                                 + '  - newChild\n';
      const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, { ...opts, wikiLink: false });
      const expdSubTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['newChild'] },
        { text: 'newChild', ancestors: ['root', 'child1'], children: [] },
      ];
      assert.deepEqual(actlSubTree, expdSubTree);
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
            { text: 'root', ancestors: [], children: ['child1', 'child2'] },
            { text: 'child1', ancestors: ['root'], children: ['grandchild1', 'grandchild2'] },
            { text: 'grandchild1', ancestors: ['root', 'child1'], children: [] },
            { text: 'grandchild2', ancestors: ['root', 'child1'], children: [] },
            { text: 'child2', ancestors: ['root'], children: [] },
          ],
        };
      });
    
      it('concrete trunk; single file; options; graft/prune; add leaf', () => {
        // setup
        const updatedContent: Record<string, string> = {
          'root':
            '- [[child1]]\n'
          + '  - [[grandchild1]]\n'
          + '  - [[grandchild2]]\n'
          + '- [[child2]]\n'
          + '- [[newChild]]\n'
        };
        // go
        const result: TreeNode[] | string = update(initialTree, 'root', updatedContent, opts);
        // assert
        assert(Array.isArray(result));
        assert.equal(spyGraft.callCount, 1);
        assert(spyGraft.calledWith('root', 'newChild'));
        assert.equal(spyPrune.callCount, 0);
      });
  
      it('concrete trunk; single file; options; graft/prune; remove leaf', () => {
        // setup
        const updatedContent: Record<string, string> = {
          'root':
            '- [[child1]]\n'
          + '  - [[grandchild1]]\n'
          + '  - [[grandchild2]]\n'
        };
        // go
        const result: TreeNode[] | string = update(initialTree, 'root', updatedContent, opts);
        // assert
        assert(Array.isArray(result));
        assert.equal(spyGraft.callCount, 0);
        assert.equal(spyPrune.callCount, 1);
        assert(spyPrune.calledWith('root', 'child2'));
      });
  
      it('concrete trunk; single file; options; graft/prune; add trunk', () => {
        // setup
        const updatedContent: Record<string, string> = {
          'root':
            '- [[child1]]\n'
          + '  - [[grandchild1]]\n'
          + '  - [[grandchild2]]\n'
          + '- [[child2]]\n'
          + '- [[newbranch]]\n',
          'newbranch':
            '- [[newchild]]\n'
        };
        // go
        const result: TreeNode[] | string = update(initialTree, 'root', updatedContent, opts);
        // assert
        assert(Array.isArray(result));
        assert.equal(spyGraft.callCount, 2);
        assert(spyGraft.calledWith('root', 'newbranch'));
        assert(spyGraft.calledWith('newbranch', 'newchild'));
        assert.equal(spyPrune.callCount, 0);
      });
  
      it('concrete trunk; single file; options; graft/prune; remove trunk', () => {
        // setup
        const updatedContent: Record<string, string> = {
          'root':
            '- [[child1]]\n'
          + '  - [[grandchild1]]\n'
        };
        // go
        const result: TreeNode[] | string = update(initialTree, 'root', updatedContent, opts);
        // assert
        assert(Array.isArray(result));
        assert.equal(spyGraft.callCount, 0);
        assert.equal(spyPrune.callCount, 2);
        assert(spyPrune.calledWith('child1', 'grandchild2'));
        assert(spyPrune.calledWith('root', 'child2'));
      });
  
      it('concrete trunk; single file; options; graft/prune; no change; no graft or prune', () => {
        // setup
        const updatedContent: Record<string, string> = {
          'root':
            '- [[child1]]\n'
          + '  - [[grandchild1]]\n'
          + '  - [[grandchild2]]\n'
          + '- [[child2]]\n'
        };
        // go
        const result: TreeNode[] | string = update(initialTree, 'root', updatedContent, opts);
        // assert
        assert(Array.isArray(result));
        assert.equal(spyGraft.callCount, 0);
        assert.equal(spyPrune.callCount, 0);
      });
  
      it('concrete trunk; single file; options; graft/prune; reorganized only (no additions or removals)', () => {
        // setup
        const updatedContent: Record<string, string> = {
          'root':
            '- [[child2]]\n'
          + '  - [[child1]]\n'
          + '    - [[grandchild1]]\n'
          + '    - [[grandchild2]]\n'
        };
        // go
        const result: TreeNode[] | string = update(initialTree, 'root', updatedContent, opts);
        // assert
        assert(Array.isArray(result));
        assert.equal(spyGraft.callCount, 1);
        assert(spyGraft.calledWith('child2', 'child1'));
        assert.equal(spyPrune.callCount, 1);
        assert(spyPrune.calledWith('root', 'child1'));
      });
  
      it('concrete trunk; single file; options; graft/prune; nested structures', () => {
        // setup
        const updatedContent: Record<string, string> = {
          'root':
            '- [[child1]]\n'
          + '  - [[grandchild1]]\n'
          + '    - [[newGreatGrandchild]]\n'
          + '  - [[grandchild2]]\n'
          + '- [[child2]]\n'
          + '  - [[newGrandchild]]\n'
        };
        // go
        const result = update(initialTree, 'root', updatedContent, opts);
        // assert
        assert(Array.isArray(result));
        assert.equal(spyGraft.callCount, 2);
        assert(spyGraft.calledWith('grandchild1', 'newGreatGrandchild'));
        assert(spyGraft.calledWith('child2', 'newGrandchild'));
        assert.equal(spyPrune.callCount, 0);
      });

    });

    // error handling

    it('concrete trunk; single file; error handling; missing subtree', () => {
      // setup
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
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1a'] },
          { text: 'child1a', ancestors: ['root'], children: ['branch1', 'grandchild1a'] },
          { text: 'branch1', ancestors: ['root', 'child1a'], children: ['branch2'] },
          { text: 'branch2', ancestors: ['root', 'child1a', 'branch1'], children: ['child1c'] },
          { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
          { text: 'child1c', ancestors: ['root', 'child1a', 'branch1', 'branch2'], children: [] },
        ],
      };
      // go
      assert.strictEqual(
        update(tree, 'missing', { 'missing': '- [[newnode]]' }, opts),
        'semtree.update(): subroot not found in the tree: "missing"',
      );
    });

    it('concrete trunk; single file; error handling; should restore original tree state on error', () => {
      // setup
      const initialTree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
          'grandchild1': 'root',
        },
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: ['grandchild1'] },
          { text: 'grandchild1', ancestors: ['root', 'child1'], children: [] },
        ],
      };
      const initialTreeClone: SemTree = JSON.parse(JSON.stringify(initialTree));
      const replacement: string = '- [[child1]]\n'
                                + '    - [[grandchild1]]\n'
                                + '  - [[invalidlyIndentedChild]]\n';
      // go
      const result = update(initialTree, 'root', { 'root': replacement }, opts);
      // assert
      const error: string = 'semtree.lint(): improper indentation found:\n'
                          + '\n'
                          + '- File "root" Line 2 (over-indented): "    - [[grandchild1]]"\n';
      assert.strictEqual(result, error);
      assert.deepStrictEqual(initialTree, initialTreeClone);
    });

    // multi file

    it('concrete trunk; multi file; remove trunk; clean (only removing a single branch)', () => {
      // setup
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
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1a'] },
          { text: 'child1a', ancestors: ['root'], children: ['branch1', 'grandchild1a'] },
          { text: 'branch1', ancestors: ['root', 'child1a'], children: ['branch2'] },
          { text: 'branch2', ancestors: ['root', 'child1a', 'branch1'], children: ['child1c'] },
          { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
          { text: 'child1c', ancestors: ['root', 'child1a', 'branch1', 'branch2'], children: [] },
        ],
      };
      const replacement: string = '- [[child1a]]\n'
                                + '  - [[grandchild1a]]\n';
      // subtree
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
        { text: 'root', ancestors: [], children: ['child1a'] },
        { text: 'child1a', ancestors: ['root'], children: ['grandchild1a'] },
        { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
      ];
      assert.deepEqual(actlTree, expdTree);
    });

    it('concrete trunk; multi file; remove trunk; with remaining dead branch (not mentioned explicitly in update but is effected); (this is also the root case)', () => {
      // setup
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
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1a'] },
          { text: 'child1a', ancestors: ['root'], children: ['branch1', 'grandchild1a'] },
          { text: 'branch1', ancestors: ['root', 'child1a'], children: ['branch2'] },
          { text: 'branch2', ancestors: ['root', 'child1a', 'branch1'], children: ['child1c'] },
          { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
          { text: 'child1c', ancestors: ['root', 'child1a', 'branch1', 'branch2'], children: [] },
        ],
      };
      const replacement: string = '- [[child1a]]\n'
                                + '  - [[grandchild1a]]\n';
      // subtree
      const actlSubTree: TreeNode[] | string = update(tree, 'root', { 'root': replacement }, opts);
      const expdSubTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1a'] },
        { text: 'child1a', ancestors: ['root'], children: ['grandchild1a'] },
        { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
      ];
      assert.deepEqual(actlSubTree, expdSubTree);
      // final updated tree
      const actlTree: TreeNode[] = tree.nodes;
      const expdTree: TreeNode[] = [
        { text: 'root', ancestors: [], children: ['child1a'] },
        { text: 'child1a', ancestors: ['root'], children: ['grandchild1a'] },
        { text: 'grandchild1a', ancestors: ['root', 'child1a'], children: [] },
      ];
      assert.deepEqual(actlTree, expdTree);
    });

    // orphan (trunks)

    it('concrete trunk; orphan trunk files; no change to tree, no change to orphans; no orphans', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: ['root', 'child1'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
          'grandchild1': 'child1',
        },
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: ['grandchild1'] },
          { text: 'grandchild1', ancestors: ['root', 'child1'], children: [] },
        ]
      };
      const replacement: Record<string, string> = { root: '- [[child1]]\n  - [[grandchild1]]\n' };
      // act
      const result: TreeNode[] | string = update(tree, 'root', replacement, opts);
      // assert
      assert.deepStrictEqual(tree.orphans, []);
      assert.deepStrictEqual(tree.nodes, [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['grandchild1'] },
        { text: 'grandchild1', ancestors: ['root', 'child1'], children: [] },
      ]);
    });

    it('concrete trunk; orphan trunk files; no tree change, no orphan changes; has orphans', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
        },
        orphans: ['branch1', 'branch2'],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: [] },
        ]
      };
      const replacement: Record<string, string> = { root: '- [[child1]]\n  - [[newChild]]\n', branch1: '- [[branch2]]\n', branch2: '- [[unused-child]]\n' };
      // act
      const result: TreeNode[] | string = update(tree, 'root', replacement, opts);
      // assert
      assert.deepStrictEqual(tree.orphans, ['branch1', 'branch2']);
      assert.deepStrictEqual(tree.nodes, [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['newChild'] },
        { text: 'newChild', ancestors: ['root', 'child1'], children: [] },
      ]);
    });

    it('concrete trunk; orphan trunk files; branch removal -- no orphans, add orphans', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: ['root', 'branch1', 'branch2'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
          'branch1': 'child1',
          'branch2': 'branch1',
          'leaf1': 'branch2',
        },
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: ['branch1'] },
          { text: 'branch1', ancestors: ['root', 'child1'], children: ['branch2'] },
          { text: 'branch2', ancestors: ['root', 'child1', 'branch1'], children: ['leaf1'] },
          { text: 'leaf1', ancestors: ['root', 'child1', 'branch1', 'branch2'], children: [] },
        ]
      };
      // here
      const replacement: Record<string, string> = { root: '- [[child1]]\n', 'unused-branch': '- [[unused-child]]\n' };
      // act
      const result: TreeNode[] | string = update(tree, 'root', replacement, opts);
      // assert
      assert.deepStrictEqual(tree.orphans, ['unused-branch']);
      assert.deepStrictEqual(tree.nodes, [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: [] },
      ]);
    });

    it('concrete trunk; orphan trunk files; branch removal; has orphans, adopt all orphans', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
        },
        orphans: ['branch1', 'branch2'],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: [] },
        ]
      };
      const replacement = { root: '- [[child1]]\n  - [[branch1]]\n    - [[branch2]]\n' };
      // act
      const result: TreeNode[] | string = update(tree, 'root', replacement, opts);
      // assert
      assert.deepStrictEqual(tree.orphans, []);
      assert.deepStrictEqual(tree.nodes, [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['branch1'] },
        { text: 'branch1', ancestors: ['root', 'child1'], children: ['branch2'] },
        { text: 'branch2', ancestors: ['root', 'child1', 'branch1'], children: [] },
      ]);
    });

    it('concrete trunk; orphan trunk files; branch removal; has orphans, adopt some orphans', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: ['root'],
        petioleMap: {
          'root': 'root',
          'child1': 'root',
        },
        orphans: ['branch1', 'branch2', 'branch3'],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: [] },
        ]
      };
      const replacement: Record<string, string> = { root: '- [[child1]]\n  - [[branch1]]\n  - [[branch2]]\n', branch1: '', branch2: '', branch3: '' };
      // act
      const result: TreeNode[] | string = update(tree, 'root', replacement, opts);
      // assert
      assert.deepStrictEqual(tree.orphans, ['branch3']);
      assert.deepStrictEqual(tree.nodes, [
        { text: 'root', ancestors: [], children: ['child1'] },
        { text: 'child1', ancestors: ['root'], children: ['branch1', 'branch2'] },
        { text: 'branch1', ancestors: ['root', 'child1'], children: [] },
        { text: 'branch2', ancestors: ['root', 'child1'], children: [] },
      ]);
    });

  });

  describe('virtual trunk', () => {

    it('virtual trunk; cannot run updates on virtual trunk', () => {
      // setup
      const tree: SemTree = {
        root: 'root',
        trunk: [],
        petioleMap: {},
        orphans: [],
        nodes: [
          { text: 'root', ancestors: [], children: ['child1'] },
          { text: 'child1', ancestors: ['root'], children: ['grandchild1'] },
          { text: 'grandchild1', ancestors: ['root', 'child1'], children: [] },
        ]
      };
      const replacement: Record<string, string> = { root: '- [[child1]]\n  - [[grandchild1]]\n' };
      // act
      const result: TreeNode[] | string = update(tree, 'root', replacement, { ...opts, virtualTrunk: true });
      // assert
      assert.strictEqual(result, 'semtree.update(): cannot run updates on a virtual trunk');
    });

  });

});
