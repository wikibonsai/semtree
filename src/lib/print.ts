import type { TreeNode } from '../lib/types';


export const print = (nodes: TreeNode[]): string | undefined => {
  const buildTreeStr = (
    curNodeName: string | undefined = nodes.find(n => n.isRoot)?.text,
    prefix: string = '',
  ): string => {
    if (curNodeName === undefined) {
      console.log('semtree.print: error: no root node');
      return '';
    }
    let output: string = curNodeName + '\n';
    const node: TreeNode | undefined = nodes.find((node: TreeNode) => node.text === curNodeName);
    if (node === undefined) {
      console.log(`semtree.print: error: no node with text "${curNodeName}"`);
      return output;
    }
    node.children.forEach((child: string, index: number) => {
      const isLastChild: boolean = (index === node.children.length - 1);
      const childPrefix: string = prefix + (isLastChild ? '└── ' : '├── ');
      const grandchildPrefix: string = prefix + (isLastChild ? '    ' : '|   ');
      const subtree: string = buildTreeStr(child, grandchildPrefix);
      output += childPrefix + subtree;
    });
    return output;
  };

  const treeStr: string | undefined = buildTreeStr();
  console.log(treeStr);
  return treeStr;
};
