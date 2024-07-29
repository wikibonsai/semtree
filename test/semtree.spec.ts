import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { TreeNode } from '../src/lib/types';

import {
  cntntMultiWikiSpace2DashNawIndexnEntrySiblings,
  cntntMultiWikiSpace2DashIDnNone,
} from './fixtures/content';
import {
  dataConcreteMultiID,
  dataVirtualNawIndexnEntrySiblings,
} from './fixtures/data';

import { SemTree } from '../src/index';


let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;
let fakeConsoleLog: sinon.SinonSpy;

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
      semtree = new SemTree({
        testing: true
      });
    });

    it('add leaf', () => {
      semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root');
      const wikiGraphContentWithIDWithSpaces = 
`- [[graph-(0a1b2)]]
  - [[tree-(0a1b2)]]
  - [[web-(0a1b2)]]
  - [[newChild-(0a1b2)]]
`;
      semtree.updateSubTree({ 'graph': wikiGraphContentWithIDWithSpaces }, 'graph');
      const expectedUpdatedTree = JSON.parse(JSON.stringify(dataConcreteMultiID));
      const nodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'graph-(0a1b2)');
      expectedUpdatedTree[nodeIndex].children.push('newChild-(0a1b2)');
      expectedUpdatedTree.push(
        {
          'text': 'newChild-(0a1b2)',
          'ancestors': ['root', 'root-(0a1b2)', 'graph', 'graph-(0a1b2)'],
          'children': [],
        },
      );
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
    });

    it('remove leaf', () => {
      semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root');
      const wikiGraphContentWithIDWithSpaces = 
`- [[graph-(0a1b2)]]
  - [[web-(0a1b2)]]
`;
      semtree.updateSubTree({ 'graph': wikiGraphContentWithIDWithSpaces }, 'graph');
      const expectedUpdatedTree = JSON.parse(JSON.stringify(dataConcreteMultiID));
      const parentNodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'graph-(0a1b2)');
      expectedUpdatedTree[parentNodeIndex].children = ['web-(0a1b2)'];
      const nodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'tree-(0a1b2)');
      expectedUpdatedTree.splice(nodeIndex, 1);
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
    });

    it('add trunk', () => {
      semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root');
      const wikiGraphContentWithIDWithSpaces = 
`- [[graph-(0a1b2)]]
  - [[tree-(0a1b2)]]
  - [[web-(0a1b2)]]
  - [[newbranch]]
`;
      const newBranchContent =
`- [[newbranchcontent]]
`;
      semtree.updateSubTree({
        'graph': wikiGraphContentWithIDWithSpaces,
        'newbranch': newBranchContent,
      }, 'graph');
      const expectedUpdatedTree = JSON.parse(JSON.stringify(dataConcreteMultiID));
      const nodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'graph-(0a1b2)');
      expectedUpdatedTree[nodeIndex].children.push('newbranch');
      expectedUpdatedTree.push(
        {
          'text': 'newbranch',
          'ancestors': ['root', 'root-(0a1b2)', 'graph', 'graph-(0a1b2)'],
          'children': ['newbranchcontent'], },
        { 
          'text': 'newbranchcontent',
          'ancestors': ['root', 'root-(0a1b2)', 'graph', 'graph-(0a1b2)', 'newbranch'],
          'children': [],
        },
      );
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
    });

    describe('remove trunk', () => {

      it('clean', () => {
        semtree.parse(cntntMultiWikiSpace2DashNawIndexnEntrySiblings, 'i.bonsai');
        const rmBranch = 
`- [[social-science]]
  - [[discourse]]
`;
        semtree.updateSubTree({
          'i.social-science': rmBranch
        }, 'i.social-science');
        const tree: TreeNode[] = JSON.parse(JSON.stringify(dataVirtualNawIndexnEntrySiblings));
        const expectedUpdatedTree: TreeNode[] = tree.filter((node: TreeNode) => ((node.text !== 'i.education')
                                                                                && (node.text !== 'learning-theory')
                                                                                && (node.text !== 'conditioning')
                                                                                && (node.text !== 'classical-conditioning')));
        const expectedRmedNodes: TreeNode[] = tree.filter((node: TreeNode) => ((node.text === 'i.education')
                                                                              || (node.text === 'learning-theory')
                                                                              || (node.text === 'conditioning')
                                                                              || (node.text === 'classical-conditioning')));
        const node: TreeNode | undefined = expectedUpdatedTree.find((node: TreeNode) => node.text === 'social-science');
        if (node) node.children = ['discourse'];
        for (const expdNode of expectedUpdatedTree) {
          assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
        }
        for (const rmNode of expectedRmedNodes) {
          assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === rmNode.text), undefined);
        }
      });

      it('with remaining dead branch', () => {
        semtree.parse(cntntMultiWikiSpace2DashNawIndexnEntrySiblings, 'i.bonsai');
        const rmBranch = 
`- [[root]]
  - [[semantic-tree]]
`;
        semtree.updateSubTree({
          'i.bonsai': rmBranch,
        }, 'i.bonsai');
        let expectedUpdatedTree = JSON.parse(JSON.stringify(dataVirtualNawIndexnEntrySiblings));
        expectedUpdatedTree = expectedUpdatedTree.filter((node: TreeNode) => ((node.text === 'i.bonsai') || (node.text === 'root') || (node.text === 'semantic-tree')));
        expectedUpdatedTree.find((node: TreeNode) => node.text === 'semantic-tree').children = [];
        for (const expdNode of expectedUpdatedTree) {
          assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
        }
        assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'i.social-science'), undefined);
        assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'i.education'), undefined);
        assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'social-science'), undefined);
        assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'education'), undefined);
      });

    });

    it('root case', () => {
      semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root');
      const newRootContent: string = 
`- [[root-(0a1b2)]]
  - [[newnode]]`;
      assert.deepStrictEqual(
        semtree.updateSubTree({ 'root': newRootContent }, 'root'),
        [
          {
            ancestors: [],
            children: [
              'root-(0a1b2)'
            ],
            text: 'root'
          },
          {
            ancestors: [
              'root'
            ],
            children: [
              'newnode'
            ],
            text: 'root-(0a1b2)'
          },
          {
            ancestors: [
              'root',
              'root-(0a1b2)'
            ],
            children: [],
            text: 'newnode'
          }
        ]
      );
    });

    describe('error', () => {

      it('missing subtree', () => {
        semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root');
        assert.strictEqual(
          semtree.updateSubTree({ 'missing': '- [[newnode]]' }, 'missing'),
          'SemTree.updateSubTree(): subroot not found in the tree: "missing"',
        );
      });

    });

  });

});
