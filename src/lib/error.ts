// // tree-errors.ts
// class TreeBuildError extends Error {
//   constructor(message: string, code: number) {
//     super(message);
//     this.name = 'TreeBuildError';
//     this.code = code;
//   }
// }

// // build.ts
// import { TreeBuildError } from './tree-errors';

// export function build(root, content, opts) {
//   try {
//     // Build process
//   } catch (error) {
//     if (error instanceof TreeBuildError) {
//       // Handle known errors
//     } else {
//       // Handle unexpected errors
//     }
//   }
// }
