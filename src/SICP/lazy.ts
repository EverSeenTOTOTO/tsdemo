/* eslint-disable @typescript-eslint/naming-convention */
// 《SICP》 4.2
import { memo } from './stream';

export const cons = <T, U>(x: T, g: () => U) => (f: (x: T, y: () => U) => any) => f(x, memo(g));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const car = (pair: ReturnType<typeof cons>) => pair((x, _g) => x);
export const cdr = (pair: ReturnType<typeof cons>) => pair((_x, g) => g());

export const list_filter = <T>(s: any, f: (x: T) => boolean): any => {
  return f(car(s))
    ? cons(car(s), () => list_filter(cdr(s), f))
    : list_filter(cdr(s), f);
};

export const list_map = <T, U>(s: any, f: (x: T) => U): any => {
  return cons(f(car(s)), () => list_map(cdr(s), f));
};

export const list_get = <T>(s: any, i: number): T => {
  return i <= 0
    ? car(s)
    : list_get(cdr(s), i - 1);
};

export const list_foreach = <T>(s: any, f: (x: T) => void, n: number): void => {
  if (n <= -1) return;
  f(car(s));
  list_foreach(cdr(s), f, n - 1);
};
