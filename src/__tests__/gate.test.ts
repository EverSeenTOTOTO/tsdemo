import * as g from '@/electron/gate';
import { Executor } from '@/graph/executor';
import { Context } from '@/graph/index';
import { createStore } from '@/graph/nodes';

const executor = new Executor();
const ctx = new Context(executor);

beforeEach(() => {
  ctx.clear();
});

it('test Not', async () => {
  const not = new g.NotGate('not');
  const log = createStore(ctx, 'log', ['info']);

  ctx.addNodes(not, log);
  ctx.connect(not, 'output', log, 'info');

  ctx.emit(not, 'input', 1);
  await ctx.step();
  expect(log.state).toEqual({ info: 0 });

  ctx.emit(not, 'input', 0);
  await ctx.step();
  expect(log.state).toEqual({ info: 1 });
});

it('test And', async () => {
  const and = new g.AndGate('and');
  const log = createStore(ctx, 'log', ['info']);

  ctx.addNodes(and, log);
  ctx.connect(and, 'output', log, 'info');

  ctx.emit(and, 'lhs', 0);
  ctx.emit(and, 'rhs', 0);
  await ctx.run();
  expect(log.state).toEqual({ info: 0 });

  ctx.emit(and, 'lhs', 1);
  ctx.emit(and, 'rhs', 1);
  await ctx.run();
  expect(log.state).toEqual({ info: 1 });
});

it('test Or', async () => {
  const or = new g.OrGate('or');
  const log = createStore(ctx, 'log', ['info']);

  ctx.addNodes(or, log);
  ctx.connect(or, 'output', log, 'info');

  ctx.emit(or, 'lhs', 0);
  ctx.emit(or, 'rhs', 0);
  await ctx.run();
  expect(log.state).toEqual({ info: 0 });

  ctx.emit(or, 'lhs', 1);
  await ctx.run();
  expect(log.state).toEqual({ info: 1 });
});

it('test Xor', async () => {
  const xor = new g.XorGate('xor');
  const log = createStore(ctx, 'log', ['info']);

  ctx.addNodes(xor, log);
  ctx.connect(xor, 'output', log, 'info');

  ctx.emit(xor, 'lhs', 0);
  ctx.emit(xor, 'rhs', 0);
  await ctx.run();
  expect(log.state).toEqual({ info: 0 });

  ctx.emit(xor, 'lhs', 1);
  await ctx.run();
  expect(log.state).toEqual({ info: 1 });
});

it('test AndNot', async () => {
  const andNot = new g.AndNotGate('and-not');
  const log = createStore(ctx, 'log', ['info']);

  ctx.addNodes(andNot, log);
  ctx.connect(andNot, 'output', log, 'info');

  ctx.emit(andNot, 'lhs', 0);
  ctx.emit(andNot, 'rhs', 0);
  await ctx.run();
  expect(log.state).toEqual({ info: 1 });

  ctx.emit(andNot, 'lhs', 1);
  ctx.emit(andNot, 'rhs', 1);
  await ctx.run();
  expect(log.state).toEqual({ info: 0 });
});

it('test OrNot', async () => {
  const orNot = new g.OrNotGate('or-not');
  const log = createStore(ctx, 'log', ['info']);

  ctx.addNodes(orNot, log);
  ctx.connect(orNot, 'output', log, 'info');

  ctx.emit(orNot, 'lhs', 0);
  ctx.emit(orNot, 'rhs', 0);
  await ctx.run();
  expect(log.state).toEqual({ info: 1 });

  ctx.emit(orNot, 'rhs', 1);
  await ctx.run();
  expect(log.state).toEqual({ info: 0 });
});

it('test compose', async () => {
  const x = new g.XorGate('x');
  const y = new g.XorGate('y');

  const Z = createStore(ctx, 'Z', ['info']);
  const L = createStore(ctx, 'L', ['info']);

  ctx.addNodes(x, y, Z, L);

  ctx.connect(x, 'output', y, 'lhs');
  ctx.connect(x, 'output', Z, 'info');
  ctx.connect(y, 'output', L, 'info');

  ctx.emit(x, 'lhs', 0);
  ctx.emit(x, 'rhs', 1);
  ctx.emit(y, 'rhs', 0);

  await ctx.run();
  expect(Z.state).toEqual({ info: 1 });
  expect(L.state).toEqual({ info: 1 });
});

it('test TG', async () => {
  const t = new g.TGate('t');
  const T = createStore(ctx, 'T', ['T']);

  ctx.addNodes(t, T);

  ctx.connect(t, 'lhs', T, 'T');

  ctx.emit(t, 'rhs', 1);
  await ctx.run();
  expect(T.record.length).toBe(0);

  // 导通
  ctx.emit(t, 'ctrl', 1);
  await ctx.run();
  expect(T.state).toEqual({ T: 1 });

  ctx.emit(t, 'rhs', 0);
  await ctx.run();
  expect(T.state).toEqual({ T: 0 });

  T.clear();

  // 断开
  ctx.emit(t, 'ctrl', 0);
  await ctx.run();
  expect(T.record.length).toBe(0);
});
