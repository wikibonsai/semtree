import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { TreeNode } from '../src/lib/types';

import {
  content,
  wikiContentsIndexAndEntrySiblings,
  wikiContentWithIDWithSpacesWithPreceedingNewlines,
  wikiContentWithDuplicatesWithSpaces,
  wikiContentWithIDWithSpaces,
  wikiContentsWithIDWithSpaces,
  contentWithIDWithSpaces,
  contentWithIDWith3Spaces,
  contentWithIDWithTabs,
  wikiContentsWithIDWithSpacesWithCycle,
} from './fixtures/content';
import {
  treeIndexAndEntrySiblings,
  treeNoSuffix,
  treeWithIDConcreteTrunk,
  treeWithIDVirtualTrunk,
  treeWithLoc,
} from './fixtures/data';
import { outputWithID } from './fixtures/output';

import { SemTree } from '../src/index';


let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;
let fakeConsoleLog: sinon.SinonSpy;

describe('semtree', () => {

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

  describe('parse()', () => {

    describe('with virtual trunk', () => {

      beforeEach(() => {
        semtree = new SemTree({
          testing: true,
          virtualTrunk: true,
        });
      });

      it('default; leave existing id; 2 spaces; wiki', () => {
        assert.deepEqual(semtree.parse(wikiContentWithIDWithSpaces), treeWithIDVirtualTrunk);
      });

      it('no mkdn list; no suffix', () => {
        semtree.opts({
          mkdnList: false,
          suffix: 'none',
        });
        assert.deepEqual(semtree.parse(content), treeNoSuffix);
      });

      it('append location in tree', () => {
        semtree.opts({
          suffix: 'loc',
          wikitext: false,
        });
        assert.deepEqual(semtree.parse(content), treeWithLoc);
      });

      it('append id', () => {
        semtree.opts({
          suffix: 'id',
          wikitext: false,
        });
        assert.deepEqual(semtree.parse(content), treeWithIDVirtualTrunk);
      });

      it('leave existing id; 2 spaces', () => {
        semtree.opts({ wikitext: false });
        assert.deepEqual(semtree.parse(contentWithIDWithSpaces), treeWithIDVirtualTrunk);
      });

      it('leave existing id; 3 spaces', () => {
        semtree.opts({ wikitext: false });
        assert.deepEqual(semtree.parse(contentWithIDWith3Spaces), treeWithIDVirtualTrunk);
      });

      it('leave existing id; tabs', () => {
        semtree.opts({ wikitext: false });
        assert.deepEqual(semtree.parse(contentWithIDWithTabs), treeWithIDVirtualTrunk);
      });

      it('error; duplicate text (leave existing id; 2 spaces; wiki)', () => {
        assert.strictEqual(
          semtree.parse(wikiContentWithDuplicatesWithSpaces),
          'tree did not build, duplicate nodes found:\n\nroot-(0a1b2)\n\n'
        );
      });

      describe('single file', () => {

        it('default; leave existing id; 2 spaces; wiki', () => {
          semtree.parse(wikiContentWithIDWithSpaces);
          semtree.print();
          assert.deepEqual(fakeConsoleLog.getCall(0).args[0], outputWithID);
        });

      });

      describe('multi file', () => {

        it('default; leave existing id; 2 spaces; wiki', () => {
          assert.deepEqual(semtree.parse(wikiContentsWithIDWithSpaces, 'root'), treeWithIDVirtualTrunk);
        });

        it('error; cycle detected', () => {
          assert.strictEqual(semtree.parse(wikiContentsWithIDWithSpacesWithCycle), undefined);
          assert.strictEqual(fakeConsoleWarn.called, true);
          assert.strictEqual(fakeConsoleWarn.getCall(0).args[0], 'cannot parse multiple files without a "root" defined');
        });

        it('error; must define root with multiple files', () => {
          assert.strictEqual(semtree.parse(wikiContentsWithIDWithSpaces), undefined);
          assert.strictEqual(fakeConsoleWarn.called, true);
          assert.strictEqual(fakeConsoleWarn.getCall(0).args[0], 'cannot parse multiple files without a "root" defined');
        });

      });

    });

    describe('with concrete trunk', () => {

      beforeEach(() => {
        semtree = new SemTree({
          testing: true
        });
      });

      it('default; leave existing id; 2 spaces; wiki', () => {
        assert.deepEqual(semtree.parse(wikiContentsWithIDWithSpaces, 'root'), treeWithIDConcreteTrunk);
      });

      it('ensure index and entry type nodes can be siblings', () => {
        assert.deepEqual(semtree.parse(wikiContentsIndexAndEntrySiblings, 'i.bonsai'), treeIndexAndEntrySiblings);
      });

      it.skip('default; leave existing id; 2 spaces; wiki; strip preceeding newlines', () => {
        assert.deepEqual(semtree.parse(wikiContentWithIDWithSpacesWithPreceedingNewlines), treeWithIDConcreteTrunk);
      });

      it('error; must define root with multiple files', () => {
        assert.strictEqual(semtree.parse(wikiContentsWithIDWithSpaces), undefined);
        assert.strictEqual(fakeConsoleWarn.called, true);
        assert.strictEqual(fakeConsoleWarn.getCall(0).args[0], 'cannot parse multiple files without a "root" defined');
      });

    });

  });

  describe('updateSubTree()', () => {

    beforeEach(() => {
      semtree = new SemTree({
        testing: true
      });
    });

    it('add leaf', () => {
      semtree.parse(wikiContentsWithIDWithSpaces, 'root');
      const wikiGraphContentWithIDWithSpaces = 
`- [[graph-(0a1b2)]]
  - [[tree-(0a1b2)]]
  - [[web-(0a1b2)]]
  - [[newChild-(0a1b2)]]
`;
      semtree.updateSubTree({ 'graph': wikiGraphContentWithIDWithSpaces }, 'graph');
      const expectedUpdatedTree = JSON.parse(JSON.stringify(treeWithIDConcreteTrunk));
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
      semtree.parse(wikiContentsWithIDWithSpaces, 'root');
      const wikiGraphContentWithIDWithSpaces = 
`- [[graph-(0a1b2)]]
  - [[web-(0a1b2)]]
`;
      semtree.updateSubTree({ 'graph': wikiGraphContentWithIDWithSpaces }, 'graph');
      const expectedUpdatedTree = JSON.parse(JSON.stringify(treeWithIDConcreteTrunk));
      const parentNodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'graph-(0a1b2)');
      expectedUpdatedTree[parentNodeIndex].children = ['web-(0a1b2)'];
      const nodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'tree-(0a1b2)');
      expectedUpdatedTree.splice(nodeIndex, 1);
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
    });

    it('add trunk', () => {
      semtree.parse(wikiContentsWithIDWithSpaces, 'root');
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
      const expectedUpdatedTree = JSON.parse(JSON.stringify(treeWithIDConcreteTrunk));
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
        semtree.parse(wikiContentsIndexAndEntrySiblings, 'i.bonsai');
        const rmBranch = 
`- [[social-science]]
  - [[discourse]]
`;
        semtree.updateSubTree({
          'i.social-science': rmBranch
        }, 'i.social-science');
        const tree: TreeNode[] = JSON.parse(JSON.stringify(treeIndexAndEntrySiblings));
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
        semtree.parse(wikiContentsIndexAndEntrySiblings, 'i.bonsai');
        const rmBranch = 
`- [[root]]
  - [[semantic-tree]]
`;
        semtree.updateSubTree({
          'i.bonsai': rmBranch,
        }, 'i.bonsai');
        let expectedUpdatedTree = JSON.parse(JSON.stringify(treeIndexAndEntrySiblings));
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

    describe.skip('fail', () => {

      it('error; duplicate text', () => {
        // todo
      });

    });

  });

});