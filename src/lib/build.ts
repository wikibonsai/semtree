import { SemTree, BuildTreeOpts, TreeNode } from './types';
import { defaultOpts, RGX_INDENT } from './const';
import { checkDuplicates } from './duplicates';
import { rawText } from './func';


export const build = (
  root: string,
  content: Record<string, string[]>,
  opts: BuildTreeOpts = defaultOpts,
): SemTree | string  => {
  ////
  // setup
  // opts
  opts = { ...defaultOpts, ...opts };
  // tree
  const virtualTrunk: boolean    = opts.virtualTrunk ?? false;
  // subtree building
  const subroot: string          = opts.subroot      ?? '';
  const ancestors: TreeNode[]    = opts.ancestors    ?? [];
  const level: number            = opts.level        ?? 0;
  // syntax
  const mkdnList: boolean        = opts.mkdnList     ?? true;
  const wikitext: boolean        = opts.wikitext     ?? true;
  const indentSize: number       = opts.indentSize    ?? 2;
  // tree
  const tree: SemTree = opts.tree ?? {
    nodes: [],
    trunk: [],
    petioleMap: {},
    root: '',
  } as SemTree;
  if (!virtualTrunk && (tree.trunk.length === 0)) {
    tree.trunk = Object.keys(content);
  }
  const visited: Set<string> = new Set();
  ////
  // go
  const buildRes: TreeNode[] | string = buildTree(root, content, ancestors, level);
  if (typeof buildRes === 'string') {
    return buildRes;
  }
  ////
  // validate
  // check for unprocessed content
  if (Object.keys(content).length > 0) {
    const unprocessedFiles = Object.keys(content).join(', ');
    return `semtree.build(): some files were not processed: ${unprocessedFiles}`;
  }
  if (Object.entries(content).length === 0) {
    // duplicates are checked later in updateSubTree()
    if (subroot.length === 0) {
      // if duplicate nodes were found, return warning string
      const hasDups: string | undefined = checkDuplicates(tree.nodes);
      if (typeof hasDups === 'string') {
        return hasDups;
      }
    }
  }
  ////
  // finish
  tree.nodes = buildRes;
  // if given, call option methods
  if (opts.setRoot) {
    opts.setRoot(tree.root);
  }
  if (opts.graft) {
    // sort nodes by their level to ensure parents are grafted before children
    const sortedNodes: TreeNode[] = tree.nodes.sort((a, b) => a.ancestors.length - b.ancestors.length);
    for (const node of sortedNodes) {
      if (node.text !== tree.root) {
        const parentName: string | undefined = node.ancestors[node.ancestors.length - 1];
        if (parentName) {
          opts.graft(parentName, node.text);
        }
      }
    }
  }
  return tree;

  // helper functions

  function buildTree(
    curKey: string,
    content: Record<string, string[]>,
    ancestors: TreeNode[] = [],
    totalLevel: number = 0,
  ): TreeNode[] | string {
    // cycle check
    if (visited.has(curKey)) {
      return `semtree.build(): cycle detected involving node "${curKey}"`;
    }
    visited.add(curKey);
    if (!virtualTrunk) {
      const node: TreeNode | string = handleFname(curKey, totalLevel);
      if (typeof node === 'string') {
        return node;
      }
      ancestors.push(node);
      totalLevel += 1;
    }
    // handle file...
    const lines: string[] = content[curKey];
    for (const [i, line] of lines.entries()) {
      // txt processing
      const text: string = line.replace(RGX_INDENT, '');
      if (!text || text.length == 0) { continue; }
      const rawTxt: string = rawText(text, { hasBullets: mkdnList, hasWiki: wikitext });
      // self-reference check
      const selfRef: boolean = (curKey === rawTxt);
      if (!virtualTrunk && selfRef) {
        return `semtree.build(): self-referential node "${rawTxt}"`;
      }
      // trunk check
      const trunkNames: string[] = Array.from(new Set(Object.keys(content)));
      const isTrunk: boolean = trunkNames.includes(rawTxt);
      // calculate level
      const indentMatch: RegExpMatchArray | null = line.match(RGX_INDENT);
      if (indentMatch === null) { continue; }
      const cumulativeLevel: number = calcLvl(indentMatch, i) + totalLevel;
      // go
      ancestors = popGrandAncestor(cumulativeLevel, ancestors);
      // trunk
      if (isTrunk) {
        const result: TreeNode[] | string = buildTree(
          rawTxt,
          content,
          ancestors,
          cumulativeLevel,
        );
        if (typeof result === 'string') {
          return result;
        }
        const resNode: TreeNode | undefined = result.find(node => node.text === rawTxt);
        if (resNode !== undefined) {
          ancestors.push(resNode);
        }
      // 'leaf'
      } else {
        // if virtualTrunk, create root from very first node
        if ((cumulativeLevel === 0) && virtualTrunk) {
          if (tree.root !== '') {
            return `semtree.build(): cannot have multiple root nodes, node "${rawTxt}" at same level as root node "${tree.root}"`;
          }
          const node: TreeNode | string = addRoot(rawTxt);
          if (typeof node === 'string') {
            return node;
          }
          ancestors.push(node);
          continue;
        }
        // leaf
        const node: TreeNode | string = addBranch(rawTxt, ancestors.map(p => p.text), curKey);
        if (typeof node === 'string') {
          return node;
        }
        ancestors.push(node);
      }
    }
    // rm node after processing
    delete content[curKey];
    visited.delete(curKey);
    // return current state of nodes
    return structuredClone(tree.nodes);
  }

  function calcLvl(levelMatch: RegExpMatchArray, i: number): number {
    const size: number | undefined = levelMatch[0].length;
    const bumpForZeroBase: number = 1;
    const thisLevel: number = (!virtualTrunk && (i === 0))
      ? (size / indentSize) + bumpForZeroBase
      : size / indentSize;
    return thisLevel;
  }

  function handleFname(curKey: string, totalLevel: number): TreeNode | string {
    if (curKey === subroot) {
      const node: TreeNode | undefined = tree.nodes.find(n => n.text === subroot);
      if (node === undefined) {
        return `semtree.handleRoot(): subroot node "${subroot}" not found in tree`;
      } else {
        return node;
      }
    } else {
      if (tree.root === '' && totalLevel === 0) {
        return addRoot(curKey);
      } else {
        const trnkFname: string | undefined = getTrunkKey(curKey, structuredClone(content));
        if (trnkFname === undefined) {
          return `semtree.handleRoot(): trunk file for '${curKey}' not found in content`;
        }
        return addBranch(curKey, ancestors.map(n => n.text), trnkFname);
      }
    }
  }

  function addRoot(text: string): TreeNode {
    tree.root = text;
    const rootNode: TreeNode = {
      text: text,
      ancestors: [],
      children: [],
    };
    tree.nodes.push(rootNode);
    if (!virtualTrunk) {
      tree.petioleMap[text] = text;
    }
    return rootNode;
  }

  function addBranch(
    text: string,
    ancestryTitles: string[],
    trnkFname?: string,
  ): TreeNode | string {
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
    const newNode: TreeNode = {
      text: text,
      ancestors: ancestryTitles,
      children: [],
    };
    tree.nodes.push(newNode);
    if (!virtualTrunk) {
      tree.petioleMap[text] = trnkFname;
    }
    return newNode;
  }

  function getTrunkKey(curKey: string, content: Record<string, string[]>): string | undefined {
    for (const key of Object.keys(content)) {
      const items: string[] = content[key].map((txt) => rawText(txt, { hasBullets: mkdnList, hasWiki: wikitext }).trim().replace(/^[-*+]\s*/, ''));
      if (items.includes(curKey)) {
        return key;
      }
    }
  }

  function popGrandAncestor(level: number, ancestors: TreeNode[]): TreeNode[] {
    const ancestorsToRemove = ancestors.length - level;
    for (let i = 0; i < ancestorsToRemove; i++) {
      ancestors.pop();
    }
    return ancestors;
  }
  // function popGrandAncestor(level: number, ancestors: TreeNode[]): TreeNode[] {
  //   const parent: TreeNode = ancestors[ancestors.length - 1];
  //   const isChild: boolean = (parent.level === (level - 1));
  //   const isSibling: boolean = (parent.level === level);
  //   // root case
  //   // if ((ancestors.length === 0) && (parent.level === 0)) {
  //   //   return ancestors;
  //   // child:
  //   // - [[parent]]
  //   //   - [[child]]
  //   // } else
  //   if (isChild) {
  //     // continue...
  //   // sibling:
  //   // - [[sibling]]
  //   // - [[sibling]]
  //   } else if (isSibling) {
  //     // we can safely throw away the last node name because
  //     // it can't have children if we've already decreased the level
  //     ancestors.pop();
  //   // unrelated (great+) (grand)parent:
  //   //     - [[descendent]]
  //   // - [[great-grandparent]]
  //   } else if (parent.level) { // (parent.level < level)
  //     const levelDiff: number = parent.level - level;
  //     for (let i = 1; i <= levelDiff + 1; i++) {
  //       ancestors.pop();
  //     }
  //   } else {
  //     // first node on page
  //     // ...
  //     console.warn(`semtree.popGrandAncestor(): unknown ancestor level: ${parent.level}`);
  //   }
  //   return ancestors;
  // }
};