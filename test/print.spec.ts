import assert from 'node:assert/strict';
import sinon from 'sinon';

import { SemTree } from '../src/index';

import {
  cntntOneWikiSpace2DashID,
} from './fixtures/content';
import { outputWithID } from './fixtures/output';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;

describe('print()', () => {

  beforeEach(() => {
    console.warn = (msg) => msg + '\n';
    fakeConsoleWarn = sinon.spy(console, 'warn');
    console.log = (msg) => msg + '\n';
    fakeConsoleLog = sinon.spy(console, 'log');
    semtree = new SemTree({
      testing: true,
      virtualTrunk: true,
    });
  });

  afterEach(() => {
    semtree.clear();
    fakeConsoleWarn.restore();
    fakeConsoleLog.restore();
  });

  describe('virtualTrunk', () => {

    describe('single', () => {

      it('default', () => {
        semtree.parse(cntntOneWikiSpace2DashID, 'root');
        semtree.print();
        assert.strictEqual(fakeConsoleLog.getCall(0).args[0], outputWithID);
      });

    });

    describe('multi', () => {

      it.skip('test', () => {
        assert.strictEqual(0, 1);
      });

    });

  });

  describe('concreteTrunk', () => {

    beforeEach(() => {
      semtree = new SemTree({
        testing: true,
      });
    });

    describe('single', () => {

      it.skip('default', () => {
        semtree.parse(cntntOneWikiSpace2DashID);
        semtree.print();
        assert.strictEqual(fakeConsoleLog.getCall(0).args[0], outputWithID);
      });

    });

    describe('multi', () => {

      it.skip('test', () => {
        assert.strictEqual(0, 1);
      });

    });

  });

});
