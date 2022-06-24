import { Env, evalExpr } from './eval';
import { parseExpr, Expr } from './parse';
import { lookahead } from './scan';
import { Position } from './utils';

export const parse = (input: string, pos = new Position()) => {
  const nodes: Expr[] = [];

  while (lookahead(input, pos).type !== 'eof') {
    nodes.push(parseExpr(input, pos));
  }

  return nodes;
};

export const evaluate = (input: string, pos = new Position()) => {
  const env = new Env();

  for (const key of Object.keys(globalThis)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    env.set(key, globalThis[key]);
  }

  return { result: parse(input, pos).map((e) => evalExpr(e, input, env)), env };
};
