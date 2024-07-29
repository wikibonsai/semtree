import assert from 'node:assert/strict';
import sinon from 'sinon';

import { SemTree } from '../src/index';

import {
  cntntOneWikiSpace2MixNa,
  cntntOneTxtSpace2NaNa,
  cntntMultiWikiSpace2DashNawIndexnEntrySiblings,
  cntntOneWikiSpace2DashIDwLeadingWS,
  cntntOneWikiSpace2DashIDwDuplicates,
  cntntOneWikiSpace2DashID,
  cntntMultiWikiSpace2DashIDnNone,
  cntntOneTxtSpace2NaID,
  cntntOneTxtSpace3NaID,
  cntntOneTxtTabNaID,
  cntntMultiWikiSpace2DashNa,
  cntntMultiTxtSpace2NaNawImproperIndent,
  cntntMultiTxtSpace2NaNawOverIndent,
  cntntOneTxtSpace2NaNawMisalignedSpacing,
} from './fixtures/content';
import {
  dataConcreteID,
  dataVirtualNawIndexnEntrySiblings,
  dataVirtualID,
  dataVirtualLoc,
  dataVirtualNa,
} from './fixtures/data';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;

describe('parse()', () => {

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

    afterEach(() => {
      semtree.clear();
    });

    describe('single file', () => {

      it.skip('default; leave existing id; 2 spaces; wiki; strip preceeding newlines', () => {
        assert.deepStrictEqual(semtree.parse(cntntOneWikiSpace2DashIDwLeadingWS), dataConcreteID);
      });

      describe('error handling', () => {

        it('inconsistent indentation', () => {
          assert.strictEqual(
            semtree.parse(cntntOneTxtSpace2NaNawMisalignedSpacing),
            'semtree.lint(): improper indentation found:\n\n- Line 3 (inconsistent indentation): "   tree"\n- Line 4 (inconsistent indentation): " web"\n',
          );
        });

      });

    });

    describe('multi file', () => {

      it('default; leave existing id; 2 spaces; wiki', () => {
        assert.deepStrictEqual(semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root'), dataConcreteID);
      });

      it('root is root filename', () => {
        semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root');
        assert.strictEqual(semtree.root, 'root');
      });

      it('empty input', () => {
        assert.deepStrictEqual(semtree.parse(''), []);
      });

      it('ensure index and entry type nodes can be siblings', () => {
        assert.deepStrictEqual(semtree.parse(cntntMultiWikiSpace2DashNawIndexnEntrySiblings, 'i.bonsai'), dataVirtualNawIndexnEntrySiblings);
      });

      describe('error handling', () => {

        it('\'content\' param of record type should require \'root\' param', () => {
          assert.strictEqual(
            semtree.parse(cntntMultiWikiSpace2DashIDnNone),
            'SemTree.parse(): cannot parse multiple files without a "root" defined',
          );
        });

        it('must define root with multiple files', () => {
          assert.strictEqual(
            semtree.parse(cntntMultiWikiSpace2DashIDnNone),
            'SemTree.parse(): cannot parse multiple files without a "root" defined',
          );
        });
    
      });

    });

  });

  describe('virtual trunk', () => {

    beforeEach(() => {
      semtree = new SemTree({
        testing: true,
        virtualTrunk: true,
      });
    });

    afterEach(() => {
      semtree.clear();
    });

    it('empty input', () => {
      assert.deepStrictEqual(semtree.parse(''), []);
    });

    describe('single file', () => {

      describe('default', () => {

        it('default; leave existing id; 2 spaces; wiki', () => {
          assert.deepStrictEqual(
            semtree.parse(cntntOneWikiSpace2DashID),
            dataVirtualID,
          );
        });

        it('root is empty string (since no filename given)', () => {
          assert.strictEqual(semtree.root, '');
        });

      });

      it('no mkdn list; no suffix', () => {
        semtree.opts({
          mkdnList: false,
          suffix: 'none',
        });
        assert.deepStrictEqual(semtree.parse(cntntOneTxtSpace2NaNa), dataVirtualNa);
      });

      it('append location in tree', () => {
        semtree.opts({
          suffix: 'loc',
          wikitext: false,
        });
        assert.deepStrictEqual(semtree.parse(cntntOneTxtSpace2NaNa), dataVirtualLoc);
      });

      it('append id', () => {
        semtree.opts({
          suffix: 'id',
          wikitext: false,
        });
        assert.deepStrictEqual(semtree.parse(cntntOneTxtSpace2NaNa), dataVirtualID);
      });

      it('leave existing id; 2 spaces', () => {
        semtree.opts({ wikitext: false });
        assert.deepStrictEqual(semtree.parse(cntntOneTxtSpace2NaID), dataVirtualID);
      });

      it('leave existing id; 3 spaces', () => {
        semtree.opts({ wikitext: false });
        assert.deepStrictEqual(semtree.parse(cntntOneTxtSpace3NaID), dataVirtualID);
      });

      it('leave existing id; tabs', () => {
        semtree.opts({ wikitext: false });
        assert.deepStrictEqual(semtree.parse(cntntOneTxtTabNaID), dataVirtualID);
      });

      it('accept different markdown list styles', () => {
        assert.deepStrictEqual(semtree.parse(cntntOneWikiSpace2MixNa), dataVirtualNa);
      });

      describe('error handling', () => {

        it('inconsistent indentation', () => {
          assert.strictEqual(
            semtree.parse(cntntOneTxtSpace2NaNawMisalignedSpacing),
            'semtree.lint(): improper indentation found:\n\n- Line 3 (inconsistent indentation): "   tree"\n- Line 4 (inconsistent indentation): " web"\n',
          );
        });

        it('duplicate text (leave existing id; 2 spaces; wiki)', () => {
          assert.strictEqual(
            semtree.parse(cntntOneWikiSpace2DashIDwDuplicates),
            'semtree.lint(): duplicate entity names found:\n\n- Line 19: "root-(0a1b2)"\n'
          );
        });

      });

    });

    describe('multi file', () => {

      it('default; leave existing id; 2 spaces; wiki', () => {
        assert.deepStrictEqual(semtree.parse(cntntMultiWikiSpace2DashIDnNone, 'root'), dataVirtualID);
      });

      describe('error handling', () => {

        it('inconsistent indentation', () => {
          assert.strictEqual(
            semtree.parse(cntntMultiTxtSpace2NaNawImproperIndent, 'i.bonsai'),
            'semtree.lint(): improper indentation found:\n\n- File "i.bonsai" Line 3 (inconsistent indentation): "   tree"\n- File "i.bonsai" Line 4 (inconsistent indentation): " web"\n',
          );
        });

        it('over-indented', () => {
          assert.strictEqual(
            semtree.parse(cntntMultiTxtSpace2NaNawOverIndent, 'i.bonsai'),
            'semtree.lint(): improper indentation found:\n\n- File "i.bonsai" Line 3 (over-indented): "      tree"\n',
          );
        });

        it('cycle detected', () => {
          assert.strictEqual(
            semtree.parse(cntntMultiWikiSpace2DashNa),
            'SemTree.parse(): cannot parse multiple files without a "root" defined',
          );
        });

        it('missing root', () => {
          assert.strictEqual(
            semtree.parse(cntntMultiWikiSpace2DashIDnNone),
            'SemTree.parse(): cannot parse multiple files without a "root" defined',
          );
        });

      });

    });

  });

});
