import { uint, add, ge, _0, _1, _2, is_same } from './base';
import { match } from './list';

// 右侧并不重要，只是需要一个独一无二的类型

// literal
export type lit<Value extends uint> = { __lit__: Value };
// placeholder, e.g. x
export type ph<Name extends string> = { __ph__: Name };
// (lambda x.body)
export type lambda<Ph, Body> = { __lambda__: [Ph, Body] };
// (func args)
export type app<Func, Args> = { __app__: [Func, Args] };
// lambda with env
export type closure<Lambda, Env> = { __closure__: [Lambda, Env] };
// env(key-value pair)
export type binding<Ph, Value, UpperEnv> = {
  __binding__: [Ph, Value, UpperEnv];
};
export type empty_env = { __empty_env__: never };
// (+ Lhs Rhs)
export type add_expr<Lhs, Rhs> = { __add_expr__: [Lhs, Rhs] };

export type env_lookup<Ph, Env> =
  Env extends binding<Ph, infer Value, infer _>
    ? Value
    : Env extends binding<infer _, infer _, infer UpperEnv>
      ? env_lookup<Ph, UpperEnv>
      : never;

export type apply<Closure, Args> =
  Closure extends closure<lambda<infer Ph, infer Body>, infer Env>
    ? evaluate<Body, binding<Ph, Args, Env>>
    : never;

export type eval_lit<T> = T extends lit<infer Val> ? Val : never;

export type eval_ph<T, Env> =
  T extends ph<infer Name> ? env_lookup<ph<Name>, Env> : never;

export type eval_lambda<T, Env> =
  T extends lambda<infer Ph, infer Body>
    ? closure<lambda<Ph, Body>, Env>
    : never;

export type eval_app<T, Env> =
  T extends app<infer Func, infer Args>
    ? apply<evaluate<Func, Env>, evaluate<Args, Env>>
    : never;

export type eval_add<T, Env> =
  T extends add_expr<infer TL, infer TR>
    ? evaluate<TL, Env> extends infer Lhs
      ? evaluate<TR, Env> extends infer Rhs
        ? Lhs extends uint
          ? Rhs extends uint
            ? is_same<Lhs, never> extends false
              ? is_same<Rhs, never> extends false
                ? add<Lhs, Rhs>
                : never
              : never
            : never
          : never
        : never
      : never
    : never;

export type evaluate<T, Env> = match<
  T,
  [
    [lit<any>, eval_lit<T>],
    [ph<any>, eval_ph<T, Env>],
    [lambda<any, any>, eval_lambda<T, Env>],
    [app<any, any>, eval_app<T, Env>],
    [add_expr<any, any>, eval_add<T, Env>],
    [any, never],
  ]
>;

// placeholder
export type x = { __ph__: 'x' };
export type y = { __ph__: 'y' };

// ((x) => x)(2)
// ((lambda (x) x) 2)
type foo = evaluate<app<lambda<x, x>, lit<_2>>, empty_env>;
// ((x) => (y) => x + y)(1)(2)
// ((lambda (x) (lambda (y) (+ x y))) 1) 2)
type bar = evaluate<
  app<app<lambda<x, lambda<y, add_expr<x, y>>>, lit<_1>>, lit<_2>>,
  empty_env
>;
