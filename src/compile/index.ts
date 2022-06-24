import fs from 'fs';
import readline from 'readline';
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

export const setupJsGlobal = (env: Env) => {
  for (const key of Object.getOwnPropertyNames(globalThis)) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    env.set(key, globalThis[key]);
  }

  env.set('import', (pkg: string) => import(pkg));
  // eslint-disable-next-line import/no-dynamic-require, global-require
  env.set('require', (pkg: string) => require(pkg));

  return env;
};

export const evaluate = (input: string, env = new Env(), pos = new Position()) => {
  return { result: parse(input, pos).map((e) => evalExpr(e, input, env)), env };
};

export const repl = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '$> ',
  });

  rl.prompt();
  rl.on('line', (line) => {
    try {
      console.log(...evaluate(line, setupJsGlobal(new Env())).result);
    } catch (e) {
      console.error(e);
    } finally {
      rl.prompt();
    }
  });

  return rl;
};

export const evalFile = (file: string) => {
  const content = fs.readFileSync(file, 'utf8');
  return evaluate(content, setupJsGlobal(new Env()));
};
