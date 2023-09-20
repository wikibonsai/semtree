import assert from 'node:assert/strict';
import sinon from 'sinon';

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

  describe('parse; single file', () => {

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
        'Tree did not build, duplicate nodes found:\n\nroot-(0a1b2)\n\n'
      );
    });

  });

  describe('parse; multi file; virtual trunk', () => {

    it('default; leave existing id; 2 spaces; wiki', () => {
      assert.deepEqual(semtree.parse(wikiContentsWithIDWithSpaces, 'root'), treeWithIDVirtualTrunk);
    });

    it('error; must define root with multiple files', () => {
      assert.strictEqual(semtree.parse(wikiContentsWithIDWithSpaces), undefined);
      assert.strictEqual(fakeConsoleWarn.called, true);
      assert.strictEqual(fakeConsoleWarn.getCall(0).args[0], 'Cannot parse multiple files without a "root" defined');
    });

  });

  describe('print; single file', () => {

    it('default; leave existing id; 2 spaces; wiki', () => {
      semtree.parse(wikiContentWithIDWithSpaces);
      semtree.print();
      assert.deepEqual(fakeConsoleLog.getCall(0).args[0], outputWithID);
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
      assert.strictEqual(fakeConsoleWarn.getCall(0).args[0], 'Cannot parse multiple files without a "root" defined');
    });

  });

});
