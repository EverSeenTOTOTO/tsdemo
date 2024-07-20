export type is_same<lhs, rhs> = lhs extends rhs
  ? rhs extends lhs
    ? true
    : false
  : false;
export type uint = { prev: uint };

export type _0 = { prev: never };

export type next<val extends uint> = { prev: val };
export type prev<val extends uint> =
  is_same<val, _0> extends true ? never : val['prev'];

export type _1 = next<_0>;
export type _2 = next<_1>;
export type _3 = next<_2>;
export type _4 = next<_3>;
export type _5 = next<_4>;
export type _6 = next<_5>;
export type _7 = next<_6>;
export type _8 = next<_7>;
export type _9 = next<_8>;

// 加
export type add<lhs extends uint, rhs extends uint> =
  is_same<lhs, _0> extends false ? add<prev<lhs>, next<rhs>> : rhs;

// 减
export type sub<lhs extends uint, rhs extends uint> =
  is_same<rhs, _0> extends false ? sub<prev<lhs>, prev<rhs>> : lhs;

// 乘
export type mul<lhs extends uint, rhs extends uint> =
  is_same<lhs, _1> extends false ? add<rhs, mul<prev<lhs>, rhs>> : rhs;

// p: lhs 往前走, n: lhs 往后走
export type ge_helper<p extends uint, n extends uint, rhs extends uint> =
  is_same<p, rhs> extends true
    ? true
    : is_same<n, rhs> extends true
      ? false
      : is_same<p, _0> extends true // 往前已经走到了0，往后还没到rhs
        ? false
        : ge_helper<prev<p>, next<n>, rhs>;

// >=
export type ge<lhs extends uint, rhs extends uint> = ge_helper<lhs, lhs, rhs>;
// >
export type gt<lhs extends uint, rhs extends uint> =
  is_same<lhs, rhs> extends true ? false : ge_helper<lhs, lhs, rhs>;
// <=
export type le<lhs extends uint, rhs extends uint> =
  gt<lhs, rhs> extends true ? false : true;
// <
export type lt<lhs extends uint, rhs extends uint> =
  ge<lhs, rhs> extends true ? false : true;

export type div_helper<
  lhs extends uint,
  rhs extends uint,
  quotient extends uint,
> =
  is_same<rhs, _0> extends true // 除0
    ? never
    : lt<lhs, rhs> extends true
      ? [quotient, lhs] // [商, 余数]
      : div_helper<sub<lhs, rhs>, rhs, next<quotient>>;

// 除
// @ts-ignore
export type div<lhs extends uint, rhs extends uint> = div_helper<
  lhs,
  rhs,
  _0
>[0];
// @ts-ignore
export type mod<lhs extends uint, rhs extends uint> = div_helper<
  lhs,
  rhs,
  _0
>[1];
