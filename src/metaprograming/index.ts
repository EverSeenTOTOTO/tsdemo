/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */

type is_same<lhs, rhs> = lhs extends rhs ? rhs extends lhs ? true : false : false;
type uint = { prev: uint };

type _0 = { prev: never };

type next<val extends uint> = { prev: val };
type prev<val extends uint> = is_same<val, _0> extends true ? never : val['prev'];

type _1 = next<_0>;
type _2 = next<_1>;
type _3 = next<_2>;
type _4 = next<_3>;
type _5 = next<_4>;
type _6 = next<_5>;
type _7 = next<_6>;
type _8 = next<_7>;
type _9 = next<_8>;

// 加
type add<lhs extends uint, rhs extends uint> = is_same<lhs, _0> extends false
  ? add<prev<lhs>, next<rhs>>
  : rhs;

// 减
type sub<lhs extends uint, rhs extends uint> = is_same<rhs, _0> extends false
  ? sub<prev<lhs>, prev<rhs>>
  : lhs;

// 乘
type mul<lhs extends uint, rhs extends uint> = is_same<lhs, _1> extends false
  ? add<rhs, mul<prev<lhs>, rhs>>
  : rhs;

// p: lhs 往前走, n: lhs 往后走
type ge_helper<p extends uint, n extends uint, rhs extends uint> = is_same<p, rhs> extends true
  ? true
  : is_same<n, rhs> extends true
    ? false
    : is_same<p, _0> extends true // 往前已经走到了0，往后还没到rhs
      ? false
      : ge_helper<prev<p>, next<n>, rhs>;

// >=
type ge<lhs extends uint, rhs extends uint> = ge_helper<lhs, lhs, rhs>;
// >
type gt<lhs extends uint, rhs extends uint> = is_same<lhs, rhs> extends true ? false : ge_helper<lhs, lhs, rhs>;
// <=
type le<lhs extends uint, rhs extends uint> = gt<lhs, rhs> extends true ? false : true;
// <
type lt<lhs extends uint, rhs extends uint> = ge<lhs, rhs> extends true ? false : true;

type div_helper<lhs extends uint, rhs extends uint, quotient extends uint> = is_same<rhs, _0> extends true // 除0
  ? never
  : lt<lhs, rhs> extends true
    ? [quotient, lhs] // [商, 余数]
    : div_helper<sub<lhs, rhs>, rhs, next<quotient>>;

// 除
// @ts-ignore
type div<lhs extends uint, rhs extends uint> = div_helper<lhs, rhs, _0>[0];
// @ts-ignore
type mod<lhs extends uint, rhs extends uint> = div_helper<lhs, rhs, _0>[1];

// 类型列表
type first<L> = L extends [infer First, ...infer _] ? First : never;
type rest<L> = L extends []
  ? []
  : L extends [infer _, ...infer Rest]
    ? Rest
    : never;
type len<L> = L extends []
  ? _0
  : L extends [infer _, ...infer Rest]
    ? add<_1, len<Rest>>
    : never;

type concat<lhs, rhs> = lhs extends [...infer Lhs]
  ? rhs extends [...infer Rhs]
    ? [...Lhs, ...Rhs]
    : never
  : never;

type slice_helper<L, length extends uint> = is_same<length, _0> extends true
  ? []
  : concat<first<L> extends never ? [] : [first<L>], slice_helper<rest<L>, sub<length, _1>>>;

type slice<L, start extends uint, length extends uint> = is_same<start, _0> extends true
  ? slice_helper<L, length>
  : slice<rest<L>, sub<start, _1>, length>;

type at<L, index extends uint> = ge<index, len<L>> extends true
  ? never
  : is_same<index, _0> extends true
    ? first<L>
    : at<rest<L>, sub<index, _1>>;

type index_of<L, T> = L extends []
  ? never
  : is_same<first<L>, T> extends true
    ? _0
    : index_of<rest<L>, T> extends never
      ? never
      : add<_1, index_of<rest<L>, T>>;

type insert_at<L, index extends uint, Ts> = concat<
concat<slice<L, _0, index>, Ts extends [...infer Rs] ? Rs : [Ts]>,
slice<L, index, sub<len<L>, index>>
>;

type remove_at<L, index extends uint, length extends uint> = is_same<length, _0> extends true
  ? L
  : concat<
  slice<L, _0, index>,
  slice<L, add<index, length>, sub<sub<len<L>, index>, length>>
  >;

type L = concat<[string, number, void], [undefined, unknown]>;
type x = remove_at<L, _7, _8>;
