import * as g from '@/electron/gate';
import { Executor } from '@/graph/executor';
import { Context } from '@/graph/index';
import { LoggerNode } from '@/graph/nodes';

const executor = new Executor();
const ctx = new Context(executor);
const info = jest.spyOn(console, 'info').mockImplementation(() => { });

beforeEach(() => {
  ctx.reset();
  info.mockClear();
});

it('test Not', async () => {
  const not = new g.NotGate('not');
  const log = new LoggerNode('not');

  ctx.addNodes(not, log);
  ctx.connect(not, 'output', log, 'info');

  ctx.emit(not, 'input', 1);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('not: 0');

  ctx.emit(not, 'input', 0);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('not: 1');
});

it('test And', async () => {
  const and = new g.AndGate('and');
  const log = new LoggerNode('and');

  ctx.addNodes(and, log);
  ctx.connect(and, 'output', log, 'info');

  ctx.emit(and, 'rhs', 1);
  await ctx.step();
  expect(info).not.toHaveBeenCalled();

  ctx.emit(and, 'lhs', 0);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('and: 0');

  // rhs变0晚于A变1，产生瞬时的高电平
  ctx.emit(and, 'lhs', 1);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('and: 1');

  ctx.emit(and, 'rhs', 0);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('and: 0');
});

it('test Or', async () => {
  const or = new g.OrGate('or');
  const log = new LoggerNode('or');

  ctx.addNodes(or, log);
  ctx.connect(or, 'output', log, 'info');

  ctx.emit(or, 'rhs', 0);
  await ctx.step();
  expect(info).not.toHaveBeenCalled();

  ctx.emit(or, 'lhs', 0);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('or: 0');

  ctx.emit(or, 'rhs', 1);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('or: 1');
});

it('test Xor', async () => {
  const xor = new g.XorGate('xor');
  const log = new LoggerNode('xor');

  ctx.addNodes(xor, log);
  ctx.connect(xor, 'output', log, 'info');

  ctx.emit(xor, 'rhs', 1);
  await ctx.step();
  expect(info).not.toHaveBeenCalled();

  ctx.emit(xor, 'lhs', 1);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('xor: 0');

  ctx.emit(xor, 'rhs', 0);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('xor: 1');
});

it('test AndNot', async () => {
  const andNot = new g.AndNotGate('and-not');
  const log = new LoggerNode('and-not');

  ctx.addNodes(andNot, log);
  ctx.connect(andNot, 'output', log, 'info');

  ctx.emit(andNot, 'rhs', 0);
  await ctx.step();
  expect(info).not.toHaveBeenCalled();

  ctx.emit(andNot, 'lhs', 0);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('and-not: 1');

  ctx.emit(andNot, 'rhs', 1);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('and-not: 1');

  ctx.emit(andNot, 'lhs', 1);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('and-not: 0');
});

it('test OrNot', async () => {
  const orNot = new g.OrNotGate('or-not');
  const log = new LoggerNode('or-not');

  ctx.addNodes(orNot, log);
  ctx.connect(orNot, 'output', log, 'info');

  ctx.emit(orNot, 'rhs', 0);
  await ctx.step();
  expect(info).not.toHaveBeenCalled();

  ctx.emit(orNot, 'lhs', 0);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('or-not: 1');

  ctx.emit(orNot, 'rhs', 1);
  await ctx.step();
  expect(info).toHaveBeenLastCalledWith('or-not: 0');
});

it('test compose', async () => {
  const x = new g.XorGate('x');
  const y = new g.XorGate('y');

  const Z = new LoggerNode('Z');
  const L = new LoggerNode('L');

  ctx.addNodes(x, y, Z, L);

  ctx.connect(x, 'output', y, 'lhs');
  ctx.connect(x, 'output', Z, 'info');
  ctx.connect(y, 'output', L, 'info');

  ctx.emit(x, 'lhs', 0);
  ctx.emit(x, 'rhs', 1);
  ctx.emit(y, 'rhs', 0);

  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(1, 'Z: 1');
  expect(info).toHaveBeenNthCalledWith(2, 'L: 1');
});
