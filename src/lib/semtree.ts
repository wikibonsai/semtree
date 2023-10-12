import type { SemTreeOpts, TreeNode, TreeNodeBuilder } from './types';

import { customAlphabet } from 'nanoid';

import {
  closeBrackets,
  isMarkdownBullet,
  openBrackets,
  REGEX,
} from './const';


export class SemTree {
  // for unit tests
  private testing: boolean                   = false;
  // syntax configurables
  private suffix: 'none' | 'id' | 'loc'      = 'none';
  private mkdnList: boolean                  = true;
  private wikitext: boolean                  = true;
  private chunkSize: number                  = -1;
  private levelMax: number                   = -1;
  private virtualTrunk: boolean              = false;
  // data
  public root: string                        = '';
  public nodes: TreeNode[]                   = [];
  public trunk: string[]                     = []; // list of index filenames
  public petioleMap: Record<string, string>  = {}; // 'petiole': "the stalk that joins a leaf to a stem; leafstalk"; or in this case, leaf to trunk.
  public duplicates: string[]                = [];
  // nanoid
  public nanoidOpts: any = {
    alphabet: 'abcdefghijklmnopqrstuvwxyz0123456789',
    size: 5,
  };
  public action: any                         = {};

  constructor(opts?: Partial<SemTreeOpts>) {
    if (opts) { this.opts(opts); }
  }

  public opts(opts: Partial<SemTreeOpts>): void {
    // testing
    if (opts.testing)      { this.testing        = opts.testing; }
    if (opts.nanoid) {
      this.nanoidOpts.alphabet                   = opts.nanoid.alphabet;
      this.nanoidOpts.size                       = opts.nanoid.size;
    }
    // overridable methods
    if (opts.setRoot)      { this.action.setRoot = opts.setRoot; }
    if (opts.graft)        { this.action.graft   = opts.graft; }
    // parsing configurables
    if (opts.mkdnList)     { this.mkdnList       = opts.mkdnList; }
    if (opts.suffix)       { this.suffix         = opts.suffix; }
    if (opts.wikitext)     { this.wikitext       = opts.wikitext; }
    // tree shape configurables
    if (opts.virtualTrunk) { this.virtualTrunk   = opts.virtualTrunk; }
  }

  // target api methods

  public print(): void {
    console.log(this.buildTreeStr());
  }

  // single file
  public parse(content: string): any;
  // multiple files
  public parse(content: Record<string, string>, root: string): any;
  // define
  public parse(content: string | Record<string, string>, root?: string): any {
    let lines: string[];
    // single file
    if (typeof content === 'string') {
      lines = content.split('\n');
      this.setUnits(lines);
      return this.buildTree('root', { 'root': lines });
    // multiple files
    } else {
      if (!root) { console.warn('Cannot parse multiple files without a "root" defined'); return; }
      if (!Object.keys(content).includes(root)) {
        throw Error(`content hash does not contain: '${root}'; keys are: ${Object.keys(content)}'`);
      }
      lines = content[root].split('\n');
      this.setUnits(lines);
      const contentHash: Record<string, string[]> = {};
      for (const [filename, fileContent] of Object.entries(content)) {
        contentHash[filename] = fileContent.split('\n');
      }
      this.clear();
      // deepcopy content just in case because it is going to be destroyed
      return this.buildTree(root, this.deepcopy(contentHash));
    }
  }

  // api methods

  public buildTree(
    curKey: string,
    content: Record<string, string[]>,
    ancestors: TreeNodeBuilder[] = [],
    totalLevel: number = 0,
    // virtualLevels: number = 0,
  ): any {
    let nodeBuilder: TreeNodeBuilder;
    this.trunk = Object.keys(content);
    // if the trunk isn't virtual, handle index/trunk file
    if (!this.virtualTrunk) {
      nodeBuilder = {
        line: -1,
        level: totalLevel,
        text: curKey,
        ancestors: ancestors.map(n => this.rawText(n.text)),
        children: [],
      };
      if (totalLevel === 0) {
        this.addRoot(curKey);
      } else {
        this.addBranch(curKey, nodeBuilder.ancestors);
      }
      ancestors.push(nodeBuilder);
      totalLevel += 1;
    }
    // handle file...
    const lines: string[] = content[curKey];
    for (const [i, line] of lines.entries()) {
      const text: string = line.replace(REGEX.LEVEL, '');
      if (!text || text.length == 0) { continue; }
      if (this.nodes.map((node) => node.text).includes(this.rawText(text))) {
        this.duplicates.push(this.rawText(text));
        continue;
      }
      // calculate numbers
      const lineNum: number = i + 1;
      const levelMatch: RegExpMatchArray | null = line.match(REGEX.LEVEL);
      //  number of spaces
      if (levelMatch === null) { continue; }
      const size: number | undefined = this.getWhitespaceSize(levelMatch[0]);
      const level: number = this.getLevel(size) + totalLevel;
      if (this.chunkSize < 0) { this.chunkSize = 2; }
      // root
      if ((totalLevel === 0) && (i === 0)) {
        // init
        nodeBuilder = {
          line: lineNum,
          level: level,
          text: text,
          ancestors: [],
          children: [],
        };
        this.handleSuffix(nodeBuilder, lines);
        this.addRoot(this.rawText(nodeBuilder.text));
        ancestors.push(nodeBuilder);
      // node
      } else {
        // connect subtree via 'virtual' semantic-tree node
        // todo: if (curKey === this.rawText(text), print a warning: don't do that.
        const curTxt: string = this.rawText(text);
        if ((curKey !== curTxt) && Object.keys(content).includes(curTxt)) {
          // virtualLevels += this.chunkSize;
          ancestors = this.calcAncestry(level, ancestors);
          this.buildTree(this.rawText(text), content, this.deepcopy(ancestors), this.getLevel(size));
          continue;
        }
        // init
        nodeBuilder = {
          line: lineNum,
          level: level,
          text: text,
          ancestors: [],
          children: [],
        } as TreeNodeBuilder;
        this.handleSuffix(nodeBuilder, lines);
        nodeBuilder.text = this.rawText(nodeBuilder.text);
        ancestors = this.calcAncestry(level, ancestors);
        nodeBuilder.ancestors = ancestors.map(p => this.rawText(p.text));
        ancestors.push(nodeBuilder);
        this.addBranch(nodeBuilder.text, nodeBuilder.ancestors, curKey);
      }
    }
    delete content[curKey];
    // if some files were not processed and we are at the root-file-level, error out
    if ((Object.entries(content).length !== 0) && (totalLevel == 0)) {
      // throw new Error(errorMsg);
      return `SemanticTree.buildTree(): Some files were not processed --\n${Object.keys(content)}`;
    }
    if (Object.entries(content).length === 0) {
      // if duplicate nodes were found, error out
      if (this.duplicates.length !== 0) {
        // convert to set to delete duplicates, then convert to array to print
        const duplicates: string[] = Array.from(new Set(this.duplicates));
        let errorMsg: string = 'Tree did not build, duplicate nodes found:\n\n';
        errorMsg += duplicates.join(', ') + '\n\n';
        this.clear();
        // throw new Error(errorMsg);
        return errorMsg;
      }
      // if given, call option methods
      if (this.action.setRoot && this.action.graft) {
        this.action.setRoot(this.root);
        for (const node of this.nodes) {
          if (this.root !== node.text) {
            this.action.graft(node.text, node.ancestors);
          }
          // todo: print Object.keys(content)
        }
      }
      // only return the fully-built tree -- not subtrees
      return this.deepcopy(this.nodes);
    }
  }

  // internal tree-building methods

  public addRoot(text: string) {
    this.root = text;
    this.nodes.push({
      text: text,
      ancestors: [],
      children: [],
    } as TreeNode);
    this.petioleMap[text] = text;
  }

  public addBranch(text: string, ancestryTitles: string[], trnkFname?: string) {
    if (!trnkFname) { trnkFname = text; }
    for (const [i, ancestryTitle] of ancestryTitles.entries()) {
      if (i < (ancestryTitles.length - 1)) {
        const node = this.nodes.find((node) => node.text === ancestryTitle);
        if (node && !node.children.includes(ancestryTitles[i + 1])) {
          node.children.push(ancestryTitles[i + 1]);
        }
      // i === (ancestryTitles.length - 1)
      } else {
        const node = this.nodes.find((node) => node.text === ancestryTitle);
        if (node && !node.children.includes(text)) {
          node.children.push(text);
        }
      }
    }
    this.nodes.push({
      text: text,
      ancestors: ancestryTitles,
      children: [],
    } as TreeNode);
    this.petioleMap[text] = trnkFname;
  }

  private calcAncestry(level: number, ancestors: TreeNodeBuilder[]): TreeNodeBuilder[] {
    const parent: TreeNodeBuilder = ancestors[ancestors.length - 1];
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
    } else { // (parent.level < level)
      const levelDiff: number = parent.level - level;
      for (let i = 1; i <= levelDiff + 1; i++) {
        ancestors.pop();
      }
    }
    return ancestors;
  }

  private clear() {
    this.root = '';
    this.nodes = [];
    this.petioleMap = {};
    this.duplicates = [];
  }

  // utils

  private deepcopy(item: any) {
    // -_-''
    return JSON.parse(JSON.stringify(item));
  }

  public genID() {
    const nanoid = customAlphabet(this.nanoidOpts.alphabet, this.nanoidOpts.size);
    return nanoid();
  }

  public setUnits(lines: string[]) {
    // calculate number of spaces per level and size of deepest level
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lines.forEach((line, i) => {
      let level: number;
      const levelMatch = line.match(REGEX.LEVEL);
      // calculates number of spaces
      if (levelMatch) {
        if (this.chunkSize < 0) {
          this.chunkSize = this.defineLevelSize(levelMatch[0]);
        }
        level = this.getLevel(levelMatch[0].length);
      } else {
        return;
      }
      this.levelMax = (level > this.levelMax) ? level : this.levelMax;
    });
  }

  public rawText(fullText: string) {
    // strip markdown list marker if it exists
    fullText = (this.mkdnList && isMarkdownBullet(fullText.substring(0, 2))) ? fullText.slice(2, fullText.length) : fullText;
    // strip wikistring special chars and line breaks (see: https://stackoverflow.com/a/10805292)
    return fullText.replace(openBrackets, '').replace(closeBrackets, '').replace(/\r?\n|\r/g, '');
  }

  public defineLevelSize(whitespace: string) {
    if (whitespace[0] == ' ') {
      return whitespace.length;
    }
    if (whitespace[0] == '\t') {
      const tabSize: number = 4;
      return tabSize;
    }
    // console.warn('defineLevelSize: unknown whitespace:', whitespace);
    return -1;
  }

  public getWhitespaceSize(whitespace: string) {
    if (whitespace.includes(' ')) {
      return whitespace.length;
    }
    if (whitespace.includes('\t')) {
      const tabSize: number = 4;
      return whitespace.length * tabSize;
    }
    // console.warn('getWhitespaceSize: unknown whitespace:', whitespace);
    return whitespace.length;
  }

  public getLevel(size: number) {
    return (size / this.chunkSize) + 1;
  }

  // suffix-handling

  public handleSuffix(node: TreeNode, lines: string[]): void {
    // update true values
    if (this.suffix === 'loc') {
      const padLevel = this.levelMax.toString().length;
      const padLine = lines.length.toString().length;
      node.text = this.textWithLoc(node, padLevel, padLine);
    }
    if(this.suffix === 'id') {
      node.text = this.textWithID(node.text);
    }
  }

  public textWithID(text: string): any {
    let match: RegExpMatchArray | null;
    let id: string;
    let textRegex: RegExp;
    // reject all whitespace
    match = REGEX.WHITESPACE.exec(text);
    if (match) { return text; }
    if (this.wikitext) {
      textRegex = REGEX.WIKITEXT_WITH_ID;
    } else {
      textRegex = REGEX.TEXT_WITH_ID;
    }
    match = textRegex.exec(text);
    if (match) {
      text = this.wikitext ? match[2] : match[1];
      id = this.wikitext ? match[3] : match[2];
    } else {
      // mocks aren't working with nanoid / customAlphabet
      // see: https://github.com/ai/nanoid/issues/205
      if (!this.testing) { id = this.genID(); }
      else { id = '0a1b2'; }
    }
    return `${text}-(${id})`;
  }

  // 'loc' or 'location' is a suffix 
  // defined as '-x-y' where 'x' is the line number and 'y' is the level
  public textWithLoc(node: any, padLevel: number, padLine: number): any {
    const match = REGEX.TEXT_WITH_LOC.exec(node.text);
    let levelText: string = '';
    let lineText: string = '';
    if (!match) {
      levelText = node.level.toString().padStart(padLevel, '0');
      lineText = node.line.toString().padStart(padLine, '0');
    } else {
      const level: string = match[2];
      const line: string = match[3];
      if (node.level !== Number(level)) { levelText = level.padStart(padLevel, '0'); }
      if (node.line !== Number(line)) { lineText = line.padStart(padLine, '0'); }
    }
    return `${node.text}-${lineText}-${levelText}`;
  }

  // print

  public buildTreeStr(
    curNodeName: string = this.root,
    prefix: string = '',
  ): string {
    let output: string = curNodeName + '\n';
    const node: TreeNode | undefined = this.nodes.find((node: TreeNode) => node.text === curNodeName);
    if (node === undefined) { console.log('SemTree.print: error: undefined node'); return output; }
    node.children.forEach((child: string, index: number) => {
      const isLastChild: boolean = (index === node.children.length - 1);
      const childPrefix: string = prefix + (isLastChild ? '└── ' : '├── ');
      const grandchildPrefix: string = prefix + (isLastChild ? '    ' : '|   ');
      const subtree: string = this.buildTreeStr(child, grandchildPrefix);
      output += childPrefix + subtree;
    });
    return output;
  }
}
