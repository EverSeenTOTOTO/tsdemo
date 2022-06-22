/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
declare let __DEV__: boolean;

declare module '*.macro' {
  const value: any;
  export = value;
}

declare module '*.svelte' {
  const value: any;
  export = value;
}

declare module '@babel/code-frame' {
  export function codeFrameColumns(
    input: string,
    loc: { start: { line: number, column: number }, end?: { line: number, column: number } },
    options: any
  ): string;
}

declare module 'cli-table' {
  export default class Table {
    constructor(options?: any);
    toString(): string;
  }
}
