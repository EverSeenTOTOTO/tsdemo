import { createSR } from '@/electron/circuit';
import { Executor } from '@/graph/executor';
import { Context } from '@/graph/index';
import { createStore } from '@/graph/nodes';

const executor = new Executor();
const ctx = new Context(executor);

beforeEach(() => {
  ctx.reset();
});

it('test SR', async () => {
  const sr = createSR(ctx);
  const Q = createStore(ctx, 'Q', ['Q']);
  const N = createStore(ctx, 'N', ['N']);

  ctx.connect(sr.Q, 'output', Q, 'Q');
  ctx.connect(sr.N, 'output', N, 'N');

  ctx.emit(sr.R, 'input', 0);
  ctx.emit(sr.S, 'input', 1);

  await ctx.next();
  await ctx.next();

  expect(Q.record).toEqual([['Q', 1], ['Q', 1]]);
  expect(N.record).toEqual([['N', 0], ['N', 0]]);

  ctx.emit(sr.S, 'input', 0);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(Q.state).toEqual({ Q: 1 });
  expect(N.state).toEqual({ N: 0 });

  ctx.emit(sr.R, 'input', 1);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(Q.state).toEqual({ Q: 0 });
  expect(N.state).toEqual({ N: 1 });
});
