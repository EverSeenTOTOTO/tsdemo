import { repeat } from '@/utils';
import * as parse from './parse';
import { codeFrame } from './utils';

export class Env extends Map<string, unknown> {
  parent?: Env;

  constructor(parent?: Env) {
    super();
    this.parent = parent;
  }

  lookup(variable: string): { value: any, env: Env } {
    const value = this.get(variable);

    if (!value && this.parent) {
      return this.parent.lookup(variable);
    }

    return { value, env: this };
  }
}

export function evalExpr(expr: parse.Expr, input: string, env = new Env()): any {
  let value;

  switch (expr.master.type) {
    case 'Id':
      value = evalId(expr.master as parse.Id, input, env);
      break;
    case 'Lit':
      value = evalLit(expr.master as parse.Lit, input, env);
      break;
    case 'Func':
      value = evalFunc(expr.master as parse.Func, input, env);
      break;
    case 'Call':
      value = evalCall(expr.master as parse.Call, input, env);
      break;
    default:
      throw new Error(`Eval error, expect <expr>, got ${expr.master.type}`);
  }

  if (expr.dot) {
    if (typeof value !== 'object' && typeof value !== 'function') {
      throw new Error(codeFrame(input, `Eval error, call <dot> on ${typeof value}`, expr.dot.dot.pos));
    } else {
      value = evalDot(expr.dot, input, env)(value);
    }
  }

  return value;
}

export function evalCall(expr: parse.Call, input: string, env: Env) {
  if (expr.isEmpty()) return [];

  switch (expr.children[0].type) {
    case 'BinOpExpr':
      return evalBinOp(expr.children[0] as parse.BinOpExpr, input, env);
    case 'UnOpExpr':
      return evalUnOp(expr.children[0] as parse.UnOpExpr, input, env);
    case 'Assign':
      return evalAssign(expr.children[0] as parse.Assign, input, env);
    case 'Expr': {
      const caller = evalExpr(expr.children[0] as parse.Expr, input, env);
      const rest = expr.children.slice(1).map((e) => evalExpr(e as parse.Expr, input, env));

      if (typeof caller !== 'function') {
        return [caller, ...rest];
      }

      return caller(...rest);
    }
    default:
      throw new Error(codeFrame(input, `Eval error, expect <call>, got ${expr.children[0].type}`, expr.bracketL.pos));
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function evalDot(expr: parse.Dot, input: string, _env: Env) {
  return (master: any, value?: any) => {
    let key = '';
    let obj = master;
    let ptr = expr;

    while (typeof obj === 'object' && obj !== null && ptr.next) {
      const child = obj[ptr.id.name.source];

      obj = typeof child === 'function' ? child.bind(obj) : child;
      key += `.${ptr.id.name.source}`;
      ptr = ptr.next;
    }

    if (ptr.next) {
      throw new Error(codeFrame(input, `Eval error, expect ${key} to be object, got ${typeof obj}`, expr.id.name.pos));
    }

    if (value !== undefined) {
      obj[ptr.id.name.source] = value;
      return value;
    }

    const result = obj[ptr.id.name.source];

    return typeof result === 'function' ? result.bind(obj) : result;
  };
}

export function evalExpand(expr: parse.Expand, input: string, env: Env) {
  return (...value: any[]) => {
    let cursor = 0;

    expr.items.forEach((item, idx) => {
      if (cursor >= value.length) {
        throw new Error(codeFrame(input, `Eval error, expect ${cursor + 1} arguments, got: ${value.length}`, expr.bracketL.pos));
      }

      switch (item.type) {
        case '.':
          cursor++;
          break;
        case '...': {
          const count = expr.items.slice(idx + 1).filter((it) => it.type === '...').length; // '...' placeholder can be nothing
          const newCursor = value.length - (expr.items.length - idx - 1) + count;

          if (newCursor < cursor) {
            throw new Error(codeFrame(input, `Eval error, expect ${cursor + 1} arguments, got: ${value.length}`, expr.bracketL.pos));
          }

          cursor = newCursor;
          break;
        } case 'Id':
          env.set((item as parse.Id).name.source, value[cursor++]);
          break;
        case 'Expand':
          evalExpand(item as parse.Expand, input, env)(...value[cursor++]);
          break;
        default:
          throw new Error(codeFrame(input, `Eval error, expect <expand>, got ${item.type}`, expr.bracketL.pos));
      }
    });
  };
}

export function evalFunc(expr: parse.Func, input: string, env: Env) {
  return (...params: any[]) => {
    const bodyEnv = new Env(env);

    if (expr.param.type === 'Expand') {
      evalExpand(expr.param as parse.Expand, input, bodyEnv)(...params);
    }// else expect no arguments

    return evalExpr(expr.body, input, bodyEnv);
  };
}

export function evalAssign(expr: parse.Assign, input: string, env: Env) {
  const value = evalExpr(expr.assignment, input, env);

  if (expr.variable.type === 'Id') {
    const id = expr.variable as parse.Id;

    if (expr.dot) {
      const master = env.lookup(id.name.source);

      evalDot(expr.dot, input, env)(master, value);
      env.set(id.name.source, master);
    } else {
      env.set(id.name.source, value);
    }
  } else {
    evalExpand(expr.variable as parse.Expand, input, env)(...value);
  }
}

export function evalId(expr: parse.Id, input: string, env: Env) {
  const id = expr.name.source;
  const { value } = env.lookup(id);

  if (value === undefined) {
    throw new Error(codeFrame(input, `Eval error, undefined identifier: ${id}`, expr.name.pos));
  }

  return value;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function evalLit(expr: parse.Lit, input: string, _env: Env) {
  switch (expr.value.type) {
    case 'num':
      return Number(expr.value.source);
    case 'str':
      return expr.value.source.replace(/^'|'$/g, '').replace(/\\'/g, '\'');
    case 'bool':
      return expr.value.source === 'true';
    default:
      throw new Error(codeFrame(input, `Eval error, expect <literal>, got ${expr.value.type}`, expr.value.pos));
  }
}

export function evalUnOp(expr: parse.UnOpExpr, input: string, env: Env) {
  switch (expr.op.type) {
    case '!':
      return !evalExpr(expr.value, input, env);
    default:
      throw new Error(codeFrame(input, `Eval error, expect <unOp>, got ${expr.op.type}`, expr.op.pos));
  }
}

export function evalBinOp(expr: parse.BinOpExpr, input: string, env: Env) {
  const lhs = evalExpr(expr.lhs, input, env);
  const rhs = evalExpr(expr.rhs, input, env);

  switch (expr.op.type) {
    case '+':
      return lhs + rhs;
    case '-':
      return lhs - rhs;
    case '*':
      return lhs * rhs;
    case '/':
      return lhs / rhs;
    case '>':
      return lhs > rhs;
    case '<':
      return lhs < rhs;
    case '%':
      return lhs % rhs;
    case '==':
      return lhs === rhs;
    case '!=':
      return lhs !== rhs;
    case '..': {
      if (typeof lhs === 'string' && typeof rhs === 'string') {
        return lhs + rhs;
      }

      if (Number.isInteger(lhs) && Number.isInteger(rhs)) { // range [lhs, rhs)
        return repeat(lhs, Math.abs(lhs - rhs)).map((x, idx) => x + (lhs > rhs ? -idx : idx));
      }

      if (Array.isArray(lhs) && Array.isArray(rhs)) {
        return [...lhs, ...rhs];
      }
      throw new Error(codeFrame(input, `Eval error, cannot concat ${typeof lhs} and ${typeof rhs}`, expr.op.pos));
    }
    default:
      throw new Error(codeFrame(input, `Eval error, expect <binOp>, got ${expr.op.type}`, expr.op.pos));
  }
}
