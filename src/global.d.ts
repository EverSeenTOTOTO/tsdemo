/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
declare let __DEV__: boolean;

declare module '*.macro' {
  const value: any;
  export default value;
}

declare module '*.svelte' {
  const value: any;
  export default value;
}

declare module 'cli-table' {
  export default class Table {
    constructor(options?: any);
    toString(): string;
  }
}
