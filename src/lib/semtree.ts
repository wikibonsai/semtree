import type { SemTreeOpts, TreeNode } from './types';

import { REGEX } from './const';
import {
  deepcopy,
  getChunkSize,
  getWhitespaceSize,
  lint,
  rawText,
} from './func';


export class SemTree {
  // syntax configurables
  private mkdnList: boolean                  = true;
  private wikitext: boolean                  = true;
  private chunkSize: number                  = -1;
  private virtualTrunk: boolean              = false;
  // data
  public root: string                        = '';
  public nodes: TreeNode[]                   = [];
  public trunk: string[]                     = []; // list of index filenames
  public petioleMap: Record<string, string>  = {}; // a record that tracks what index file a file/leaf-node was listed in; 'petiole': "the stalk that joins a leaf to a stem; leafstalk"; or in this case, leaf to trunk.
  public dangling: string[]                  = []; // nodes no longer connected via a path of 'children' property pointers
  public duplicates: string[]                = [];
  private visited: Set<string>               = new Set();
  public action: any                         = {};

  constructor(opts?: Partial<SemTreeOpts>) {
    if (opts) { this.opts(opts); }
  }

  public opts(opts: Partial<SemTreeOpts>): void {
    // overridable methods
    if (opts.setRoot)      { this.action.setRoot = opts.setRoot; }
    if (opts.graft)        { this.action.graft   = opts.graft; }
    if (opts.prune)        { this.action.prune   = opts.prune; }
    // parsing configurables
    if (opts.mkdnList)     { this.mkdnList       = opts.mkdnList; }
    if (opts.wikitext)     { this.wikitext       = opts.wikitext; }
    // tree shape configurables
    if (opts.virtualTrunk) { this.virtualTrunk   = opts.virtualTrunk; }
  }

  // target api methods

  // single file
  public parse(content: string, root?: string): any;
  // multiple files
  public parse(content: Record<string, string>, root: string): any;
  // define
  public parse(content: string | Record<string, string>, root?: string): TreeNode[] | string {
    let contentHash: Record<string, string[]> = {};
    // single file
    if (typeof content === 'string') {
      const lines: string[] = content.split('\n').filter(line => line.trim().length > 0);
      this.chunkSize = getChunkSize(lines);
      const zeroIndentLines: string[] = lines.filter(line => !line.match(/^\s/));
      // single root does not exist
      if (zeroIndentLines.length > 1) {
        return 'SemTree.parse(): multiple lines with zero indentation found. A tree with multiple roots cannot be made. Please add a filename as a "root" parameter or fix the indentation.';
      // single root does exist
      } else if (zeroIndentLines.length === 1) {
        root = rawText(zeroIndentLines[0], this.mkdnList);
        // rm root line and adjust indentation for remaining lines
        if (!this.virtualTrunk) {
          const remainingLines: string[] = lines.slice(1).filter(line => line.trim().length > 0);
          contentHash[root] = remainingLines.map((line: string) =>  line.slice(this.chunkSize));
        } else {
          contentHash[root] = lines;
        }
      } else {
        if (!root) {
          return 'SemTree.parse(): no root specified and no line with zero indentation found. please provide a root or fix the indentation.';
        }
        contentHash[root] = lines;
      }
    // multi file
    } else {
      if (!root) {
        return 'SemTree.parse(): cannot parse multiple files without a "root" defined';
      }
      if (!Object.keys(content).includes(root)) {
        return `SemTree.parse(): content hash does not contain: '${root}'; keys are: ${Object.keys(content)}`;
      }
      contentHash = Object.fromEntries(
        Object.entries(content).map(([key, value]) => [key, value.split('\n')])
      );
      this.chunkSize = getChunkSize(contentHash[root]);
    }
    const lintError: string | void = lint(content);
    if (lintError) {
      return lintError;
    }
    // clear and build tree
    this.clear();
    const tree: TreeNode[] | string = this.buildTree(root, contentHash);
    return tree;
  }

  // useful for single page updates (even if page includes links to other index files)
  // e.g. the index file is the 'subroot' and the [[wikirefs]] on the page are 'branchNodes'
  // single file
  public updateSubTree(content: string, subroot: string): TreeNode[] | string;
  // multiple files
  public updateSubTree(content: Record<string, string>, subroot: string): TreeNode[] | string;
  // define
  public updateSubTree(content: string | Record<string, string>, subroot: string): TreeNode[] | string {
    // save state in case subtree is invalid
    const originalNodes: TreeNode[] = deepcopy(this.nodes);
    const originalTrunk: string[] = [...this.trunk];
    const originalPetioleMap: Record<string, string> = { ...this.petioleMap };
    // input validation and processing
    const contentHash: Record<string, string[]> = {};
    if ((typeof content === 'string') && (subroot !== undefined)) {
      contentHash[subroot] = content.split('\n');
    } else {
      if (!subroot) {
        return 'SemTree.updateSubTree(): cannot update multiple files without a "subroot" defined';
      }
      if (!Object.keys(content).includes(subroot)) {
        return `SemTree.updateSubTree(): content hash does not contain root: '${subroot}'`;
      }
      for (const [filename, fileContent] of Object.entries(content)) {
        contentHash[filename] = fileContent.split('\n');
      }
    }
    // find and validate subroot node
    const subrootNode: TreeNode | undefined = this.nodes.find((node) => node.text === subroot);
    if (!subrootNode) {
      return `SemTree.updateSubTree(): subroot not found in the tree: "${subroot}"`;
    }
    // prune existing subtree
    const pruneError: void | string = this.pruneSubTree(subroot);
    if (pruneError) {
      return pruneError;
    }
    // rebuild subtree
    const subrootNodeAncestors: TreeNode[] = this.nodes.filter((node) => subrootNode.ancestors.includes(node.text));
    const updatedTree: any = this.buildTree(
      subroot,
      deepcopy(contentHash),
      subroot, // the 'root' being passed in is a subroot, not necessarily the root
      subrootNodeAncestors,
      subrootNode.ancestors.length,
    );
    if (typeof updatedTree === 'string') {
      // restore state
      this.nodes = originalNodes;
      this.trunk = originalTrunk;
      this.petioleMap = originalPetioleMap;
      return updatedTree;
    }
    // post-update checks
    if (this.checkDangling()) { this.pruneDangling(); }
    if (this.checkDuplicates()) {
      // restore state
      this.nodes = originalNodes;
      this.trunk = originalTrunk;
      this.petioleMap = originalPetioleMap;
      return this.warnDuplicates();
    }
    this.refreshAncestors();
    // return subtree nodes
    const subtreeNodes: TreeNode[] = this.nodes.filter(node => this.petioleMap[node.text] === subroot);
    if (this.root !== subrootNode.text) {
      subtreeNodes.unshift(subrootNode);
    }
    return deepcopy(subtreeNodes);
  }

  public buildTree(
    curKey: string,
    content: Record<string, string[]>,
    subroot: string = '',
    ancestors: TreeNode[] = [],
    totalLevel: number = 0,
  ): TreeNode[] | string {
    // cycle check
    if (this.visited.has(curKey)) {
      return `SemTree.buildTree(): cycle detected involving node "${curKey}"`;
    }
    this.visited.add(curKey);
    let nodeBuilder: TreeNode;
    const isSubTree: boolean = subroot.length > 0;
    // if the trunk isn't virtual, handle index/trunk file
    if (!this.virtualTrunk && Object.keys(content).includes(curKey)) {
      nodeBuilder = {
        line: -1,
        level: totalLevel,
        text: curKey,
        ancestors: ancestors.map(n => n.text),
        children: [],
        isRoot: false,
      };
      // don't create a new node if we're handling the subroot of a subtree update
      if (curKey !== subroot) {
        if (totalLevel === 0) {
          this.addRoot(curKey);
        } else {
          const trnkFname: string | undefined = this.getTrunkKey(curKey, deepcopy(content));
          if (trnkFname === undefined) {
            console.log(`SemTree.buildTree(): trunk file for '${curKey}' not found in content`);
            return `SemTree.buildTree(): trunk file for '${curKey}' not found in content`;
          }
          this.addBranch(curKey, nodeBuilder.ancestors, trnkFname);
        }
      }
      ancestors.push(nodeBuilder);
      totalLevel += 1;
    }
    // handle file...
    const lines: string[] = content[curKey];
    for (const [i, line] of lines.entries()) {
      const text: string = line.replace(REGEX.LEVEL, '');
      const rawTxt: string = rawText(text, this.mkdnList);
      if (!text || text.length == 0) { continue; }
      if (this.nodes.map((node) => node.text).includes(rawTxt)) {
        this.duplicates.push(rawTxt);
        return this.warnDuplicates();
      }
      // calculate numbers
      const lineNum: number = i + 1;
      const levelMatch: RegExpMatchArray | null = line.match(REGEX.LEVEL);
      //  number of spaces
      if (levelMatch === null) { continue; }
      const size: number | undefined = getWhitespaceSize(levelMatch[0]);
      const thisLevel: number = (size / this.chunkSize) + 1;
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
          isRoot: false,
        } as TreeNode;
        if (!isSubTree) {
          this.addRoot(rawTxt);
        }
        ancestors.push(nodeBuilder);
      // node
      } else {
        // connect subtree via 'virtual' semantic-tree node
        // todo: if (curKey === rawTxt, print a warning: don't do that.
        const curTxt: string = rawTxt;
        const trunkNames: string[] = Object.keys(content);
        if ((curKey !== curTxt) && trunkNames.includes(curTxt)) {
          ancestors = this.popGrandAncestor(cumulativeLevel, ancestors);
          const result: TreeNode[] | string = this.buildTree(
            rawTxt,
            content,
            subroot,
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
          isRoot: false,
        } as TreeNode;
        ancestors = this.popGrandAncestor(cumulativeLevel, ancestors);
        nodeBuilder.ancestors = ancestors.map(p => p.text);
        ancestors.push(nodeBuilder);
        this.addBranch(nodeBuilder.text, nodeBuilder.ancestors, curKey);
      }
    }
    // rm node after processing
    delete content[curKey];
    this.visited.delete(curKey);
    // if some files were not processed and we are at the root-file-level, error out
    if ((Object.entries(content).length !== 0) && (totalLevel == 0)) {
      // throw new Error(errorMsg);
      return `SemanticTree.buildTree(): some files were not processed --\n${Object.keys(content)}`;
    }
    if (Object.entries(content).length === 0) {
      // duplicates are checked later in updateSubTree()
      if (!isSubTree) {
        // if duplicate nodes were found, return warning string
        if (this.checkDuplicates()) {
          return this.warnDuplicates();
        }
      }
      // if given, call option methods
      if (this.action.setRoot) {
        this.action.setRoot(this.root);
      }
      if (this.action.graft) {
        for (const node of this.nodes) {
          if (this.root !== node.text) {
            this.action.graft(node.text, node.ancestors);
          }
          // todo: print Object.keys(content)
          // todo: print warning for unused hash content (e.g. hanging index docs)
        }
      }
    }
    // return current state of nodes
    return deepcopy(this.nodes);
  }

  public clear() {
    // tree
    this.root = '';
    this.nodes = [];
    this.trunk = [];
    this.petioleMap = {};
    this.duplicates = [];
  }

  // internal tree-building methods

  private addRoot(text: string): void {
    this.root = text;
    this.nodes.push({
      text: text,
      ancestors: [],
      children: [],
      isRoot: true,
    } as TreeNode);
    this.petioleMap[text] = text;
  }

  private addBranch(
    text: string,
    ancestryTitles: string[],
    trnkFname?: string,
  ): void | string {
    if (this.root.length === 0) {
      return `SemTree.addBranch(): cannot add branch "${text}" to empty tree`;
    }
    if (!trnkFname) { trnkFname = text; }
    // build branch
    for (const [i, ancestryTitle] of ancestryTitles.entries()) {
      if (i < (ancestryTitles.length - 1)) {
        const node: TreeNode | undefined = this.nodes.find((node: TreeNode) => node.text === ancestryTitle);
        if (node && !node.children.includes(ancestryTitles[i + 1])) {
          node.children.push(ancestryTitles[i + 1]);
        }
      // i === (ancestryTitles.length - 1)
      } else {
        const node: TreeNode | undefined = this.nodes.find((node: TreeNode) => node.text === ancestryTitle);
        if (node && !node.children.includes(text)) {
          node.children.push(text);
        }
      }
    }
    this.nodes.push({
      text: text,
      ancestors: ancestryTitles,
      children: [],
      isRoot: false,
    } as TreeNode);
    this.petioleMap[text] = trnkFname;
  }

  private getTrunkKey(curKey: string, content: Record<string, string[]>): string | undefined {
    for (const key of Object.keys(content)) {
      const items: string[] = content[key].map((txt) => rawText(txt, this.mkdnList).trim().replace(/^[-*+]\s*/, ''));
      if (items.includes(curKey)) {
        return key;
      }
    }
  }

  private refreshAncestors(): void {
    const updateAncestors = (nodeText: string, ancestors: string[]): void => {
      const node = this.nodes.find(n => n.text === nodeText);
      if (!node) { return; }
      node.ancestors = [...ancestors]; // Create a new array to avoid reference issues
      for (const childText of node.children) {
        updateAncestors(childText, [...ancestors, node.text]);
      }
    };
    const rootNode = this.nodes.find(n => n.text === this.root);
    if (rootNode) {
      updateAncestors(this.root, []);
    }
  }

  private popGrandAncestor(level: number, ancestors: TreeNode[]): TreeNode[] {
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
      console.warn(`SemTree.popGrandAncestor(): unknown ancestor level: ${parent.level}`);
    }
    return ancestors;
  }

  private pruneDangling() {
    for (const dangle of this.dangling) {
      const curNodeIndex: number | undefined = this.nodes.findIndex((n: TreeNode) => n.text === dangle);
      if (curNodeIndex < 0) { continue; }
      this.nodes.splice(curNodeIndex, 1);
    }
  }

  // this function is written with single-page index doc updates in mind
  private pruneSubTree(nodeText: string, subroot?: string): void | string {
    if (subroot === undefined) { subroot = nodeText; }
    const node: TreeNode | undefined = this.nodes.find((n: TreeNode) => n.text === nodeText);
    if (node === undefined) {
      return `SemTree.pruneSubTree(): node with text '${nodeText}' not found in subtree`;
    }
    node.children.forEach((childText: string) => this.pruneSubTree(childText, subroot));
    // handle subroot node (should be last operation)
    if (subroot === nodeText) {
      const subrootNode: TreeNode | undefined = this.nodes.find((n: TreeNode) => n.text === nodeText);
      if (subrootNode === undefined) {
        return `SemTree.pruneSubTree(): subroot node not found for: '${subroot}'`;
      }
      // clear children
      subrootNode.children = [];
    // handle nodes on subroot (in index doc)
    } else if (this.petioleMap[nodeText] === subroot) {
      const curNodeIndex: number | undefined = this.nodes.findIndex((n: TreeNode) => n.text === nodeText);
      if (curNodeIndex < 0) {
        return `SemTree.pruneSubTree(): node with text '${nodeText}' not found in subtree`;
      }
      // rm node
      this.nodes.splice(curNodeIndex, 1);
      delete this.petioleMap[nodeText];
    } else {
      return `SemTree.pruneSubTree(): error pruning expected nodeText "${nodeText}"`;
    }
  }

  // checks

  private checkDangling(): boolean {
    const connectedNodes: Set<string> = new Set<string>();
    const traverseTree = (nodeText: string) => {
      if (connectedNodes.has(nodeText)) { return; }
      connectedNodes.add(nodeText);
      const node: TreeNode | undefined = this.nodes.find(n => n.text === nodeText);
      if (node) {
        node.children.forEach(traverseTree);
      }
    };
    // go
    traverseTree(this.root);
    this.dangling = this.nodes.filter((n: TreeNode) => !connectedNodes.has(n.text)).map((n: TreeNode) => n.text);
    return this.dangling.length > 0;
  }

  // note: this doubles as cycle detection
  private checkDuplicates(reset: boolean = false): boolean {
    const seenTexts: Set<string> = new Set<string>();
    if (reset) { this.duplicates = []; }
    for (const node of this.nodes) {
      if (seenTexts.has(node.text)) {
        this.duplicates.push(node.text);
      } else {
        seenTexts.add(node.text);
      }
    }
    return (this.duplicates.length > 0);
  }

  private warnDuplicates(dup?: string[]): string {
    // delete duplicate duplicates, convert to array
    const duplicates: string[] = dup ? dup : Array.from(new Set(this.duplicates));
    let errorMsg: string = 'SemTree.warnDuplicates(): tree did not build, duplicate nodes found:\n\n';
    errorMsg += duplicates.join(', ') + '\n\n';
    // throw new Error(errorMsg);
    return errorMsg;
  }
}
