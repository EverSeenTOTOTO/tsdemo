/* eslint-disable */
import { concat, first, rest } from './list';

export type is_same<T, U> = T extends U ? (U extends T ? true : false) : false;

// export type freeze<T> = {
//   +readonly [P in keyof T]: T[P]
// }
// 
// export type thaw<T> = {
//   -readonly [P in keyof T]: T[P]
// }
// 
// export type free<T> = {
//   [P in keyof T]+?: T[P]
// }
// 
// export type required<T> = {
//   [P in keyof T]-?: T[P]
// }
// 
// export type exclude<Keys, K> = Keys extends K ? never : Keys;
// 
// export type omit<T, K extends keyof any> = {
//   [P in exclude<keyof T, K>]: T[P]
// }
// 
// // 移除指定K的readonly
// export type remove_readonly<T, K extends keyof T> = { -readonly [P in K]: T[P] } extends infer PartA
//   ? omit<T, K> extends infer PartB
//   ? (PartA & PartB) extends infer R
//   ? { [P in keyof R]: R[P] }
//   : never
//   : never
//   : never;

export type is_identical<T, U> =
  (<P>() => P extends T ? true : false) extends infer CondType1
  ? (<Q>() => Q extends U ? true : false) extends infer CondType2
  ? is_same<CondType1, CondType2>
  : never
  : never;

export type remove_from_union<U, T> = U extends T ? never : U;

type create_list_helper<Num, List extends ArrayLike<unknown>> = is_same<List['length'], Num> extends true
  ? List
  : create_list_helper<Num, concat<List, [0]>>;

export type create_list<Num> = create_list_helper<Num, []>;

// type lt_helper<L, R, I> = is_identical<I, L> extends true
//   ? is_identical<I, R> extends true
//   ? false // =
//   : true  // <
//   : is_identical<I, R> extends true
//   ? false // >
//   : lt_helper<L, R, concat<I, [0]>>; // 均未到达，继续增长I
// 
// export type lt<Lhs, Rhs> = create_list<Lhs> extends infer L
//   ? create_list<Rhs> extends infer R
//   ? lt_helper<L, R, []>
//   : never
//   : never;

type string_concat_helper<L, S extends string> = L extends [infer First, ...infer Rest]
  ? string_concat_helper<Rest, `${S}${string & First}`>
  : S

export type string_concat<L> = string_concat_helper<L, ''>;
export type string_first<S> = S extends `${infer F}${infer _}` ? F : never;
export type string_rest<S> = S extends `${infer _}${infer R}` ? R : never;

export type string_length<S> = S extends ''
  ? 0
  : concat<[0], create_list<string_length<string_rest<S>>>> extends infer L
  ? L extends ArrayLike<unknown>
  ? L['length']
  : never
  : never;

export type tuple_to_union<T> = T extends ArrayLike<unknown> ? T[number] : never;

export type union_to_intersect<T> = (T extends unknown ? (_: T) => void : never) extends ((_: infer I) => void)
  ? I
  : never;

type union_to_intersect_fn<T> = union_to_intersect<T extends unknown ? (_: T) => void : never>;

export type union_last<T> = union_to_intersect_fn<T> extends ((_: infer Last) => void) ? Last : never;

export type union_to_tuple<T> = is_same<T, never> extends true
  ? []
  : union_last<T> extends infer Last
  ? remove_from_union<T, Last> extends infer Remain
  ? concat<union_to_tuple<Remain>, [Last]>
  : never
  : never;

type gs_foreach<choices, subset, result> = choices extends []
  ? result
  : first<choices> extends infer choice
  ? rest<choices> extends infer remain
  ? concat<subset, [choice]> extends infer s
  ? gs_helper<remain, s, result> extends infer r
  ? gs_foreach<remain, subset, r>
  : never
  : never
  : never
  : never;

type gs_helper<choices, subset, result> = concat<result, [subset]> extends infer r
  ? gs_foreach<choices, subset, r>
  : never;

export type get_subsets<U> = rest<gs_helper<U, [], []>>;

export type tuple_to_intersect<L> = L extends []
  ? unknown
  : first<L> & tuple_to_intersect<rest<L>>;

type i2t_helper<I, L> = first<L> extends infer U
  ? is_identical<tuple_to_intersect<U>, I> extends true
  ? U
  : i2t_helper<I, rest<L>>
  : never;

type get_objtypes<T, subsets> = subsets extends []
  ? []
  : first<subsets> extends infer set
  ? tuple_to_union<set> extends infer K
  ? K extends keyof T
  ? { [P in K]: T[P] } extends infer obj
  ? concat<[obj], get_objtypes<T, rest<subsets>>>
  : never
  : never
  : never
  : never;

export type intersect_to_tuple<I> = get_subsets<union_to_tuple<I>> extends infer subsets
  ? get_objtypes<I, subsets> extends infer objtypes
  ? get_subsets<objtypes> extends infer compositions
  ? i2t_helper<I, compositions>
  : never
  : never
  : never;
