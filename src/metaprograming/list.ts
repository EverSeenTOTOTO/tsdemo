import type { _0, _1, _2, _3, _5, is_same, uint, ge, add, sub } from './base';

// 类型列表
export type first<L> = L extends [infer First, ...infer _] ? First : never;
export type rest<L> = L extends []
  ? []
  : L extends [infer _, ...infer Rest]
    ? Rest
    : never;
export type len<L> = L extends []
  ? _0
  : L extends [infer _, ...infer Rest]
    ? add<_1, len<Rest>>
    : never;

export type concat<lhs, rhs> = lhs extends [...infer _l]
  ? rhs extends [...infer _r]
    ? [...lhs, ...rhs]
    : never
  : never;

export type slice_helper<L, length extends uint> =
  is_same<length, _0> extends true
    ? []
    : concat<
        first<L> extends never ? [] : [first<L>],
        slice_helper<rest<L>, sub<length, _1>>
      >;

export type slice<L, start extends uint, length extends uint> =
  is_same<start, _0> extends true
    ? slice_helper<L, length>
    : slice<rest<L>, sub<start, _1>, length>;

export type at<L, index extends uint> =
  ge<index, len<L>> extends true
    ? never
    : is_same<index, _0> extends true
      ? first<L>
      : at<rest<L>, sub<index, _1>>;

export type index_of<L, T> = L extends []
  ? never
  : is_same<first<L>, T> extends true
    ? _0
    : index_of<rest<L>, T> extends never
      ? never
      : add<_1, index_of<rest<L>, T>>;

export type insert_at<L, index extends uint, Ts> = concat<
  concat<slice<L, _0, index>, Ts extends [...infer Rs] ? Rs : [Ts]>,
  slice<L, index, sub<len<L>, index>>
>;

export type remove_at<L, index extends uint, length extends uint> =
  is_same<length, _0> extends true
    ? L
    : concat<
        slice<L, _0, index>,
        slice<L, add<index, length>, sub<sub<len<L>, index>, length>>
      >;

// 模式匹配
export type match<V, Patterns> = Patterns extends [...infer _]
  ? Patterns extends []
    ? never
    : first<Patterns> extends [infer P, infer R]
      ? V extends P
        ? R
        : match<V, rest<Patterns>>
      : never
  : never;

// map
export type map<L, Patterns> = L extends [...infer _]
  ? L extends []
    ? []
    : concat<[match<first<L>, Patterns>], map<rest<L>, Patterns>>
  : never;

// filter
export type filter<L, Patterns> = L extends [...infer _]
  ? L extends []
    ? []
    : match<first<L>, Patterns> extends true
      ? concat<[first<L>], filter<rest<L>, Patterns>>
      : filter<rest<L>, Patterns>
  : never;

type x = match<
  string,
  [
    [number, unknown], // 表示如果入参是number，则返回unknown
    [string, void],
    [undefined, boolean],
    [any, never],
  ]
>;

type y = map<
  [number, undefined, string],
  [[string, void], [number, unknown], [undefined, boolean], [any, never]]
>;

type z = filter<[number, undefined, string], [[string, true], [any, false]]>;

type fib<T extends uint> = match<
  T,
  [[_0, _0], [_1, _1], [any, add<fib<sub<T, _1>>, fib<sub<T, _2>>>]]
>;

type r = is_same<fib<_5>, _5>;
