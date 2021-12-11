/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/naming-convention */
declare let __DEV__: boolean;

declare interface Set<T> {
  vals(): T[];
  addMultiple(...args: T[]): void;
}

declare interface Map<K, V> {
  vals(): V[];
}

declare interface Array<T> {
  uniq() : Array<T>;
}
