import {
  createSR,
  createD,
  createDT,
  createJK,
  createGSR,
} from '@/electron/circuit';
import { Executor } from '@/graph/executor';
import { Context } from '@/graph/index';
import { createStore } from '@/graph/nodes';

const executor = new Executor();
const ctx = new Context(executor);

beforeEach(() => {
  ctx.clear();
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
  expect(Q.state).toEqual({ Q: 0 });
  expect(N.state).toEqual({ N: 1 });

  ctx.emit(sr.R, 'input', 0);
  ctx.emit(sr.S, 'input', 1);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(Q.state).toEqual({ Q: 1 });
  expect(N.state).toEqual({ N: 0 });
});

it('test GSR', async () => {
  const gsr = createGSR(ctx);
  const Q = createStore(ctx, 'Q', ['Q']);
  const N = createStore(ctx, 'N', ['N']);

  ctx.connect(gsr.Q, 'output', Q, 'Q');
  ctx.connect(gsr.N, 'output', N, 'N');

  ctx.emit(gsr.R, 'input', 0);
  ctx.emit(gsr.S, 'input', 1);
  ctx.emit(gsr.E, 'input', 1);

  await ctx.next();
  await ctx.next();

  ctx.emit(gsr.S, 'input', 0);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(Q.state).toEqual({ Q: 1 });
  expect(N.state).toEqual({ N: 0 });

  ctx.emit(gsr.E, 'input', 0); // CLK = 0
  ctx.emit(gsr.R, 'input', 1);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(Q.state).toEqual({ Q: 1 });
  expect(N.state).toEqual({ N: 0 });

  ctx.emit(gsr.E, 'input', 1);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(Q.state).toEqual({ Q: 0 });
  expect(N.state).toEqual({ N: 1 });
});

it('test D', async () => {
  const D = createD(ctx);
  const store = createStore(ctx, 'D', ['Q', 'N']);

  ctx.connect(D.Q, 'output', store, 'Q');
  ctx.connect(D.N, 'output', store, 'N');

  ctx.emit(D.D, 'input', 1);
  ctx.emit(D.E, 'input', 1);

  await ctx.run();
  expect(store.state).toEqual({ Q: 1, N: 0 });

  ctx.emit(D.E, 'input', 0);
  // cannot run because stability (infinite loop)
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(store.state).toEqual({ Q: 1, N: 0 });

  ctx.emit(D.D, 'input', 0);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(store.state).toEqual({ Q: 1, N: 0 });
});

it('test DT', async () => {
  const DT = createDT(ctx);
  const store = createStore(ctx, 'D', ['Q', 'N']);

  ctx.connect(DT.Q, 'output', store, 'Q');
  ctx.connect(DT.N, 'output', store, 'N');

  ctx.emit(DT.D, 'input', 1);
  ctx.emit(DT.E, 'input', 0);
  await ctx.run();
  ctx.emit(DT.E, 'input', 1);
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  await ctx.next();
  expect(store.state).toEqual({ Q: 1, N: 0 });
});

it('test JK', async () => {
  const JK = createJK(ctx);
  const store = createStore(ctx, 'D', ['Q', 'N']);

  ctx.connect(JK.Q, 'output', store, 'Q');
  ctx.connect(JK.N, 'output', store, 'N');
});
