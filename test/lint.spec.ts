import assert from 'node:assert/strict';
import sinon from 'sinon';

import { lint, SemTree } from '../src/index';

import {
  cntntOneWikiSpace2DashID,
  cntntMultiTxtSpace2NaNawImproperIndent,
  cntntMultiTxtSpace2NaNawOverIndent,
  cntntOneWikiSpace2DashIDwDuplicates,
} from './fixtures/content';


let fakeConsoleLog: sinon.SinonSpy;
let fakeConsoleWarn: sinon.SinonSpy;
let semtree: SemTree;

describe('lint()', () => {

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

  it('default', () => {
    assert.strictEqual(lint(cntntOneWikiSpace2DashID), undefined);
  });

  // indentation

  it('error; improperly indented', () => {
    assert.strictEqual(
      lint(cntntMultiTxtSpace2NaNawImproperIndent),
      `semtree.lint(): improper indentation found:

- File "i.bonsai" Line 3 (inconsistent indentation): "   tree"
- File "i.bonsai" Line 4 (inconsistent indentation): " web"
`,
    );
  });

  it('error; over-indented', () => {
    assert.strictEqual(
      lint(cntntMultiTxtSpace2NaNawOverIndent),
      `semtree.lint(): improper indentation found:

- File "i.bonsai" Line 3 (over-indented): "      tree"
`,
    );
  });

  // duplicates

  it('error; duplicates found', () => {
    assert.strictEqual(
      lint(cntntOneWikiSpace2DashIDwDuplicates),
      `semtree.lint(): duplicate entity names found:

- Line 19: "root-(0a1b2)"
`,
    );
  });

});
