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


let fakeConsoleWarn: any;
let semtree: SemTree;
let fakeConsoleLog: any;

describe('semtree; virtual trunk', () => {

  beforeEach(() => {
    console.warn = (msg) =>  msg + '\n';
    fakeConsoleWarn = sinon.spy(console, 'warn');
    semtree = new SemTree({
      testing: true,
      virtualTrunk: true,
    });
    // suppress console
    console.log = (msg) => msg + '\n';
    // fake console
    fakeConsoleLog = sinon.spy(console, 'log');
  });

  afterEach(() => {
    fakeConsoleLog.restore();
  });

  describe('parse', () => {

    describe('single file', () => {

      it('default; leave existing id; 2 spaces; wiki', () => {
        assert.deepEqual(semtree.parse(wikiContentWithIDWithSpaces), treeWithIDVirtualTrunk);
      });

      it('update', () => {
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

    });

    describe('multi file; virtual trunk', () => {

      it('default; leave existing id; 2 spaces; wiki', () => {
        assert.deepEqual(semtree.parse(wikiContentsWithIDWithSpaces, 'root'), treeWithIDVirtualTrunk);
      });

      it('error; must define root with multiple files', () => {
        assert.strictEqual(semtree.parse(wikiContentsWithIDWithSpaces), undefined);
        assert.strictEqual(fakeConsoleWarn.called, true);
        assert.strictEqual(fakeConsoleWarn.getCall(0).args[0], 'cannot parse multiple files without a "root" defined');
      });

    });

    describe('single file', () => {

      it('default; leave existing id; 2 spaces; wiki', () => {
        semtree.parse(wikiContentWithIDWithSpaces);
        semtree.print();
        assert.deepEqual(fakeConsoleLog.getCall(0).args[0], outputWithID);
      });

    });

  });

});

describe('semtree; concrete trunk', () => {

  beforeEach(() => {
    console.warn = (msg) => msg + '\n';
    fakeConsoleWarn = sinon.spy(console, 'warn');
    semtree = new SemTree({
      testing: true
    });
  });

  describe('parse; multi file; concrete trunk', () => {

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

  describe('updateSubTree', () => {

    // this test describes the behavior related to adding a link to a generic doc
    it('add leaf', () => {
      // setup
      semtree.parse(wikiContentsWithIDWithSpaces, 'root');
      // console.debug('before: ', semtree.nodes);
      // go
      const wikiGraphContentWithIDWithSpaces = 
`- [[graph-(0a1b2)]]
  - [[tree-(0a1b2)]]
  - [[web-(0a1b2)]]
  - [[newChild-(0a1b2)]]
`;
      semtree.updateSubTree({ 'graph': wikiGraphContentWithIDWithSpaces }, 'graph');
      // prep expected data
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
      // assert
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
    });

    // this test describes the behavior related to removing a link to a generic doc
    it('remove leaf', () => {
      // setup
      semtree.parse(wikiContentsWithIDWithSpaces, 'root');
      // go
      const wikiGraphContentWithIDWithSpaces = 
`- [[graph-(0a1b2)]]
  - [[web-(0a1b2)]]
`;
      semtree.updateSubTree({ 'graph': wikiGraphContentWithIDWithSpaces }, 'graph');
      // prep expected data
      const expectedUpdatedTree = JSON.parse(JSON.stringify(treeWithIDConcreteTrunk));
      const parentNodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'graph-(0a1b2)');
      expectedUpdatedTree[parentNodeIndex].children = ['web-(0a1b2)'];
      const nodeIndex = expectedUpdatedTree.findIndex((node: TreeNode) => node.text === 'tree-(0a1b2)');
      expectedUpdatedTree.splice(nodeIndex, 1);
      // assert
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
    });

    // this test describes the behavior related to adding a link to an index doc (with content)
    it('add trunk', () => {
      // setup
      semtree.parse(wikiContentsWithIDWithSpaces, 'root');
      // go
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
      // prep expected data
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
      // assert
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
    });

    // uses a different data structure than other 'updateSubTree' tests.

    // this test describes the behavior related to removing a link to an index doc, which does not contain links to other index docs
    it('remove trunk; clean', () => {
      // setup
      semtree.parse(wikiContentsIndexAndEntrySiblings, 'i.bonsai');
      // go
      const rmBranch = 
`- [[social-science]]
  - [[discourse]]
`;
      semtree.updateSubTree({
        'i.social-science': rmBranch
      }, 'i.social-science');
      // prep expected data...
      let expectedUpdatedTree = JSON.parse(JSON.stringify(treeIndexAndEntrySiblings));
      expectedUpdatedTree = expectedUpdatedTree.filter((node: TreeNode) => ((node.text !== 'i.education') && (node.text !== 'learning-theory') && (node.text !== 'conditioning') && (node.text !== 'classical-conditioning')));
      const node: TreeNode | undefined = expectedUpdatedTree.find((node: TreeNode) => node.text === 'social-science');
      if (node) node.children = ['discourse'];
      // assert
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
      assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'i.education'), undefined);
    });

    // this test describes the behavior related to removing a link to an index doc, which contains links to other index docs
    it('remove trunk; with remaining dead branch', () => {
      // setup
      semtree.parse(wikiContentsIndexAndEntrySiblings, 'i.bonsai');
      // go
      const rmBranch = 
`- [[root]]
  - [[semantic-tree]]
`;
      semtree.updateSubTree({
        'i.bonsai': rmBranch,
      }, 'i.bonsai');
      // prep expected data...
      let expectedUpdatedTree = JSON.parse(JSON.stringify(treeIndexAndEntrySiblings));
      expectedUpdatedTree = expectedUpdatedTree.filter((node: TreeNode) => ((node.text === 'i.bonsai') || (node.text === 'root') || (node.text === 'semantic-tree')));
      expectedUpdatedTree.find((node: TreeNode) => node.text === 'semantic-tree').children = [];
      // assert
      for (const expdNode of expectedUpdatedTree) {
        assert.deepStrictEqual(semtree.nodes.find((n: TreeNode) => n.text === expdNode.text), expdNode);
      }
      // branches
      assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'i.social-science'), undefined);
      assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'i.education'), undefined);
      // leaves
      assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'social-science'), undefined);
      assert.strictEqual(semtree.nodes.find((n: TreeNode) => n.text === 'education'), undefined);
    });

    describe.skip('fail', () => {

      it('error; duplicate text (leave existing id; 2 spaces; wiki)', () => {});

    });

  });

});
