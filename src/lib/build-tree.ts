import { SemTree, SemTreeOpts, TreeNode } from './types';
import { defaultOpts, REGEX } from './const';
import { checkDuplicates } from './duplicates';
import { deepcopy, getWhitespaceSize, rawText } from './func';


export const buildTree = (
  root: string,
  content: Record<string, string[]>,
  opts: SemTreeOpts = defaultOpts,
): TreeNode[] | string  => {
  // tree
  const tree: SemTree = opts.tree || {
    nodes: [],
    trunk: [],
    petioleMap: {},
    root: '',
  } as SemTree;
  const visited: Set<string> = new Set();
  // opts
  // func
  const subroot: string       = opts.subroot || '';
  // syntax
  const chunkSize: number     = opts.chunkSize || 2;
  const virtualTrunk: boolean = opts.virtualTrunk || false;
  const mkdnList: boolean     = opts.mkdnList || true;
  const wikitext: boolean     = opts.wikitext || true;
  // subtree building
  const ancestors: TreeNode[] = opts.ancestors || [];
  const level: number = opts.level || 0;

  return build(root, content, ancestors, level);

  function build(
    curKey: string,
    content: Record<string, string[]>,
    ancestors: TreeNode[] = [],
    totalLevel: number = 0,
  ): TreeNode[] | string {
    // cycle check
    if (visited.has(curKey)) {
      return `semtree.buildTree(): cycle detected involving node "${curKey}"`;
    }
    visited.add(curKey);
    let nodeBuilder: TreeNode;
    const isSubTree: boolean = subroot.length > 0;
    // if the trunk isn't virtual, handle index/trunk file
    if (!virtualTrunk && Object.keys(content).includes(curKey)) {
      nodeBuilder = {
        line: -1,
        level: totalLevel,
        text: curKey,
        ancestors: ancestors.map(n => n.text),
        children: [],
      };
      // don't create a new node if we're handling the subroot of a subtree update
      if (curKey !== subroot) {
        if (totalLevel === 0) {
          addRoot(curKey);
        } else {
          const trnkFname: string | undefined = getTrunkKey(curKey, deepcopy(content));
          if (trnkFname === undefined) {
            return `semtree.buildTree(): trunk file for '${curKey}' not found in content`;
          }
          addBranch(curKey, nodeBuilder.ancestors, trnkFname);
        }
      }
      ancestors.push(nodeBuilder);
      totalLevel += 1;
    }
    // handle file...
    const lines: string[] = content[curKey];
    for (const [i, line] of lines.entries()) {
      const text: string = line.replace(REGEX.LEVEL, '');
      const rawTxt: string = rawText(text, mkdnList);
      if (!text || text.length == 0) { continue; }
      // if (nodes.map((node) => node.text).includes(rawTxt)) {
      //   this.duplicates.push(rawTxt);
      //   return this.warnDuplicates();
      // }
      // calculate numbers
      const lineNum: number = i + 1;
      const levelMatch: RegExpMatchArray | null = line.match(REGEX.LEVEL);
      //  number of spaces
      if (levelMatch === null) { continue; }
      const size: number | undefined = getWhitespaceSize(levelMatch[0]);
      const thisLevel: number = (size / chunkSize) + 1;
      const cumulativeLevel: number = thisLevel + totalLevel;
      // root
      if ((totalLevel === 0) && (i === 0)) {
        // init
        nodeBuilder = {
          line: lineNum,
          level: cumulativeLevel,
          text: rawTxt,
          ancestors: [],
          children: [],
        } as TreeNode;
        if (!isSubTree) {
          addRoot(rawTxt);
        }
        ancestors.push(nodeBuilder);
      // node
      } else {
        // connect subtree via 'virtual' semantic-tree node
        // todo: if (curKey === rawTxt, print a warning: don't do that.
        const curTxt: string = rawTxt;
        const trunkNames: string[] = Object.keys(content);
        if ((curKey !== curTxt) && trunkNames.includes(curTxt)) {
          ancestors = popGrandAncestor(cumulativeLevel, ancestors);
          const result: TreeNode[] | string = build(
            rawTxt,
            content,
            deepcopy(ancestors),
            thisLevel,
          );
          if (typeof result === 'string') {
            return result;
          }
          continue;
        }
        // init
        nodeBuilder = {
          line: lineNum,
          level: cumulativeLevel,
          text: rawTxt,
          ancestors: [],
          children: [],
        } as TreeNode;
        ancestors = popGrandAncestor(cumulativeLevel, ancestors);
        nodeBuilder.ancestors = ancestors.map(p => p.text);
        ancestors.push(nodeBuilder);
        addBranch(nodeBuilder.text, nodeBuilder.ancestors, curKey);
      }
    }
    // rm node after processing
    delete content[curKey];
    visited.delete(curKey);
    // if some files were not processed and we are at the root-file-level, error out
    if ((Object.entries(content).length !== 0) && (totalLevel == 0)) {
      // throw new Error(errorMsg);
      return `SemanticTree.buildTree(): some files were not processed --\n${Object.keys(content)}`;
    }
    if (Object.entries(content).length === 0) {
      // duplicates are checked later in updateSubTree()
      if (!isSubTree) {
        // if duplicate nodes were found, return warning string
        const hasDups: string | undefined = checkDuplicates(tree.nodes);
        if (typeof hasDups === 'string') {
          return hasDups;
        }
      }
      // if given, call option methods
      if (opts.setRoot) {
        opts.setRoot(tree.root);
      }
      if (opts.graft) {
        for (const node of tree.nodes) {
          if (tree.root !== node.text) {
            opts.graft(node.text, node.ancestors);
          }
          // todo: print Object.keys(content)
          // todo: print warning for unused hash content (e.g. hanging index docs)
        }
      }
    }
    // return current state of nodes
    return deepcopy(tree.nodes);
  }

  function addRoot(text: string): void {
    tree.root = text;
    tree.nodes.push({
      text: text,
      ancestors: [],
      children: [],
    } as TreeNode);
    tree.petioleMap[text] = text;
  }

  function addBranch(
    text: string,
    ancestryTitles: string[],
    trnkFname?: string,
  ): void | string {
    if (tree.root.length === 0) {
      return `semtree.addBranch(): cannot add branch "${text}" to empty tree`;
    }
    if (!trnkFname) { trnkFname = text; }
    // build branch
    for (const [i, ancestryTitle] of ancestryTitles.entries()) {
      if (i < (ancestryTitles.length - 1)) {
        const node: TreeNode | undefined = tree.nodes.find((node: TreeNode) => node.text === ancestryTitle);
        if (node && !node.children.includes(ancestryTitles[i + 1])) {
          node.children.push(ancestryTitles[i + 1]);
        }
      // i === (ancestryTitles.length - 1)
      } else {
        const node: TreeNode | undefined = tree.nodes.find((node: TreeNode) => node.text === ancestryTitle);
        if (node && !node.children.includes(text)) {
          node.children.push(text);
        }
      }
    }
    tree.nodes.push({
      text: text,
      ancestors: ancestryTitles,
      children: [],
    } as TreeNode);
    tree.petioleMap[text] = trnkFname;
  }

  function getTrunkKey(curKey: string, content: Record<string, string[]>): string | undefined {
    for (const key of Object.keys(content)) {
      const items: string[] = content[key].map((txt) => rawText(txt, mkdnList).trim().replace(/^[-*+]\s*/, ''));
      if (items.includes(curKey)) {
        return key;
      }
    }
  }

  function popGrandAncestor(level: number, ancestors: TreeNode[]): TreeNode[] {
    const parent: TreeNode = ancestors[ancestors.length - 1];
    const isChild: boolean = (parent.level === (level - 1));
    const isSibling: boolean = (parent.level === level);
    // child:
    // - [[parent]]
    //   - [[child]]
    if (isChild) {
      // continue...
    // sibling:
    // - [[sibling]]
    // - [[sibling]]
    } else if (isSibling) {
      // we can safely throw away the last node name because
      // it can't have children if we've already decreased the level
      ancestors.pop();
    // unrelated (great+) (grand)parent:
    //     - [[descendent]]
    // - [[great-grandparent]]
    } else if (parent.level) { // (parent.level < level)
      const levelDiff: number = parent.level - level;
      for (let i = 1; i <= levelDiff + 1; i++) {
        ancestors.pop();
      }
    } else {
      console.warn(`semtree.popGrandAncestor(): unknown ancestor level: ${parent.level}`);
    }
    return ancestors;
  }
};
