import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { TreeNode } from '../src/lib/types';
import { SemTree } from '../src/index';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;

describe('semtree.updateSubTree()', () => {

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
      semtree = new SemTree();
    });

    afterEach(() => {
      semtree.clear();
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
        semtree.parse(content, 'root');
        const replacement: string = 
`- [[child1c]]
  - [[newChild]]
`;
        // subtree                               // go
        const actlSubTree: TreeNode[] | string = semtree.updateSubTree({ 'branch2': replacement }, 'branch2');
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
        const actlTree: TreeNode[] = semtree.nodes;
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
        semtree.parse(content, 'root');
        const replacement: string = 
`- [[child1c]]
`;
        // returned subtree                      // go
        const actlSubTree: TreeNode[] | string = semtree.updateSubTree({ 'branch2': replacement }, 'branch2');
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
        const actlTree: TreeNode[] = semtree.nodes;
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
        semtree.parse(content, 'root');
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
        const actlSubTree: TreeNode[] | string = semtree.updateSubTree(replacement, 'branch2');
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
          },
          // todo: shouldn't this be included?
          // {
          //   text: 'child1d',
          //   ancestors: ['root', 'child1a', 'branch1', 'branch2', 'child1c', 'newbranch'],
          //   children: [],
          // },
        ];
        assert.deepEqual(actlSubTree, expdSubTree);
        // final updated tree
        const actlTree: TreeNode[] = semtree.nodes;
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
          const result: TreeNode[] | string = semtree.parse(content, 'root');
          assert.notStrictEqual(typeof result, 'string');
          const replacement: string = 
`- [[child1b]]
`;
          // subtree                               // go
          const actlSubTree: TreeNode[] | string = semtree.updateSubTree({ 'branch1': replacement }, 'branch1');
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
          const actlTree: TreeNode[] = semtree.nodes;
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
          const result: TreeNode[] | string = semtree.parse(content, 'root');
          assert.notStrictEqual(typeof result, 'string');
          const replacement: string =
`- [[child1a]]
  - [[grandchild1a]]
`;
          // subtree                               // go
          const actlSubTree: TreeNode[] | string = semtree.updateSubTree({ 'root': replacement }, 'root');
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
          const actlTree: TreeNode[] = semtree.nodes;
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
          semtree.parse(content, 'root');
          // go
          assert.strictEqual(
            semtree.updateSubTree({ 'missing': '- [[newnode]]' }, 'missing'),
            'SemTree.updateSubTree(): subroot not found in the tree: "missing"',
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
