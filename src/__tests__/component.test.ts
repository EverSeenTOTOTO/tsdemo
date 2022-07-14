import {
  Position, readIdentifier, lookahead, expect as expectToken, parseExpr, AndItem, OrItem, PareItem,
} from '@/electron/parse';
import { createComponent } from '@/electron/component';

import { Executor } from '@/graph/executor';
import { Context } from '@/graph/index';
import { LoggerNode, LogLevel } from '@/graph/nodes';

it('test readIdentifier', () => {
  expect(readIdentifier('A', new Position()).type).toBe('id');
  expect(readIdentifier('A1', new Position()).type).toBe('id');
  expect(readIdentifier('A12', new Position()).type).toBe('id');
  expect(() => readIdentifier('a', new Position())).toThrow();
  expect(() => readIdentifier('1B2', new Position())).toThrow();
});

it('test lookahead', () => {
  expect(lookahead('A + B', new Position()).type).toBe('id');
  expect(lookahead('A + B', new Position(0, 1, 1)).type).toBe('space');
  expect(lookahead('A + B', new Position(0, 2, 2)).type).toBe('+');
});

it('test expect', () => {
  expect(expectToken(['~'], '~(A+~ B)', new Position()).type).toBe('~');
  expect(expectToken('~', '~(A+~ B)', new Position(0, 4, 4)).type).toBe('~');
  expect(() => expectToken(['~'], '~(A+~ B)', new Position(0, 5, 5))).toThrow();
});

it('test parseAnd', () => {
  const expr = parseExpr('ABC D') as AndItem;

  expect(expr.type).toBe('and');
  expect(expr.lhs.type).toBe('and');
});

it('test parseOr', () => {
  const expr = parseExpr('A+ B + C+ D') as OrItem;

  expect(expr.type).toBe('or');
  expect(expr.lhs.type).toBe('or');
});

it('test parsePare', () => {
  const expr = parseExpr('((C(D) ) ( A+B)+ E)') as PareItem;

  expect(expr.master.type).toBe('or');
  expect((expr.master as OrItem).lhs.type).toBe('and');
});

it('test parseExpr', () => {
  expect(() => parseExpr('EI(I7+I6+I5+I4)')).not.toThrow();
  expect(() => parseExpr('EI(~I7~I6~I5~I4)')).not.toThrow();
  expect(() => parseExpr('EI(~I7~I6I2 + ~I5~I4)')).not.toThrow();
  expect(() => parseExpr('(EI~I7~I6I2 + ~I5~I4')).toThrow();
});

const executor = new Executor();
const ctx = new Context(executor);
const logger = new LoggerNode('Z');
const info = jest.spyOn(console, 'info').mockImplementation(() => { });
const warn = jest.spyOn(console, 'warn').mockImplementation(() => { });
const error = jest.spyOn(console, 'error').mockImplementation(() => { });

beforeEach(() => {
  ctx.reset();
  info.mockClear();
});

it('test createNot', async () => {
  const add = createComponent('~A', ctx);
  const A = ctx.getNode('A')!;

  ctx.connect(add, 'output', logger, 'info');

  ctx.emit(A, 'input', 1);
  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(1, 'Z: 0');

  ctx.emit(A, 'input', 0);
  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(2, 'Z: 1');
});

it('test createAdd', async () => {
  const add = createComponent('A B', ctx);
  const A = ctx.getNode('A')!;
  const B = ctx.getNode('B')!;

  ctx.connect(add, 'output', logger, 'info');

  ctx.emit(A, 'input', 0);
  ctx.emit(B, 'input', 1);

  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(1, 'Z: 0');

  ctx.emit(A, 'input', 1);

  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(2, 'Z: 1');
});

it('test createOr', async () => {
  const or = createComponent('A+B', ctx);
  const A = ctx.getNode('A')!;
  const B = ctx.getNode('B')!;

  ctx.connect(or, 'output', logger, 'info');

  ctx.emit(A, 'input', 1);
  ctx.emit(B, 'input', 0);

  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(1, 'Z: 1');

  ctx.emit(A, 'input', 0);

  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(2, 'Z: 0');
});

it('test compose', async () => {
  const X = createComponent('A', ctx);
  const Y = createComponent('A~B + ~AB', ctx);
  const Z = createComponent('A~C + ~AC', ctx);

  const A = ctx.getNode('A')!;
  const B = ctx.getNode('B')!;
  const C = ctx.getNode('C')!;

  ctx.connect(X, 'output', logger, 'info');
  ctx.connect(Y, 'output', logger, 'warn');
  ctx.connect(Z, 'output', logger, 'error');

  logger.setLevel(LogLevel.error);

  ctx.emit(A, 'input', 1);
  ctx.emit(B, 'input', 0);
  ctx.emit(C, 'input', 1);

  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(1, 'Z: 1');
  expect(warn).toHaveBeenNthCalledWith(1, 'Z: 1');
  expect(error).toHaveBeenNthCalledWith(1, 'Z: 0');
});
