import assert from 'node:assert/strict';
import sinon from 'sinon';

import type { SemTree, SemTreeOpts } from '../src/lib/types';
import { create } from '../src/lib/create';
import { update } from '../src/lib/update';


describe('function options', () => {

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
      nodes: [
        {
          text: 'root',
          ancestors: [],
          children: ['child1', 'child2'],
        },
        {
          text: 'child1',
          ancestors: ['root'],
          children: ['grandchild1', 'grandchild2'],
        },
        {
          text: 'grandchild1',
          ancestors: ['root', 'child1'],
          children: [],
        },
        {
          text: 'grandchild2',
          ancestors: ['root', 'child1'],
          children: [],
        },
        {
          text: 'child2',
          ancestors: ['root'],
          children: [],
        },
      ],
    };
  });

  describe('create()', () => {

    it('should call graft for each node with a parent', () => {
      // setup
      const content = {
        'root': `
- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
- [[child2]]
        `
      };
      // go
      const result = create('root', content, opts);
      // assert
      assert(result instanceof Object);
      assert.equal(spyGraft.callCount, 4);
      assert(spyGraft.calledWith('root', 'child1'));
      assert(spyGraft.calledWith('child1', 'grandchild1'));
      assert(spyGraft.calledWith('child1', 'grandchild2'));
      assert(spyGraft.calledWith('root', 'child2'));
      assert.equal(spyPrune.callCount, 0);
    });

    it('should not call graft for root node', () => {
      // setup
      const content = {
        'root': `
- [[child1]]
        `
      };
      // go
      const result = create('root', content, opts);
      // assert
      assert(result instanceof Object);
      assert.equal(spyGraft.callCount, 1);
      assert(spyGraft.calledWith('root', 'child1'));
      assert.equal(spyPrune.callCount, 0);
    });
  });

  describe('update()', () => {

    it('add leaf', () => {
      // setup
      const updatedContent = {
        'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
- [[child2]]
- [[newChild]]
`};
      // go
      const result = update(initialTree, 'root', updatedContent, opts);
      // assert
      assert(Array.isArray(result));
      assert.equal(spyGraft.callCount, 1);
      assert(spyGraft.calledWith('root', 'newChild'));
      assert.equal(spyPrune.callCount, 0);
    });

    it('remove leaf', () => {
      // setup
      const updatedContent = {
        'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
`};
      // go
      const result = update(initialTree, 'root', updatedContent, opts);
      // assert
      assert(Array.isArray(result));
      assert.equal(spyGraft.callCount, 0);
      assert.equal(spyPrune.callCount, 1);
      assert(spyPrune.calledWith('root', 'child2'));
    });

    it('add trunk', () => {
      // setup
      const updatedContent = {
        'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
- [[child2]]
- [[newbranch]]
`,
        'newbranch':
`- [[newchild]]
`};
      // go
      const result = update(initialTree, 'root', updatedContent, opts);
      // assert
      assert(Array.isArray(result));
      assert.equal(spyGraft.callCount, 2);
      assert(spyGraft.calledWith('root', 'newbranch'));
      assert(spyGraft.calledWith('newbranch', 'newchild'));
      assert.equal(spyPrune.callCount, 0);
    });

    it('remove trunk', () => {
      // setup
      const updatedContent = {
        'root':
`- [[child1]]
  - [[grandchild1]]
`};
      // go
      const result = update(initialTree, 'root', updatedContent, opts);
      // assert
      assert(Array.isArray(result));
      assert.equal(spyGraft.callCount, 0);
      assert.equal(spyPrune.callCount, 2);
      assert(spyPrune.calledWith('child1', 'grandchild2'));
      assert(spyPrune.calledWith('root', 'child2'));
    });

    it('no change; no graft or prune', () => {
      // setup
      const updatedContent = {
        'root':
`- [[child1]]
  - [[grandchild1]]
  - [[grandchild2]]
- [[child2]]
`};
      // go
      const result = update(initialTree, 'root', updatedContent, opts);
      // assert
      assert(Array.isArray(result));
      assert.equal(spyGraft.callCount, 0);
      assert.equal(spyPrune.callCount, 0);
    });

    it('reorganized only (no additions or removals)', () => {
      // setup
      const updatedContent = {
        'root':
`- [[child2]]
  - [[child1]]
    - [[grandchild1]]
    - [[grandchild2]]
`};
      // go
      const result = update(initialTree, 'root', updatedContent, opts);
      // assert
      assert(Array.isArray(result));
      assert.equal(spyGraft.callCount, 1);
      assert(spyGraft.calledWith('child2', 'child1'));
      assert.equal(spyPrune.callCount, 1);
      assert(spyPrune.calledWith('root', 'child1'));
    });

    it('nested structures', () => {
      // setup
      const updatedContent = {
        'root':
`- [[child1]]
  - [[grandchild1]]
    - [[newGreatGrandchild]]
  - [[grandchild2]]
- [[child2]]
  - [[newGrandchild]]
`};
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

});