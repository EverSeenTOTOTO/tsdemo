import {
  createBCD8421,
  createCD4532,
  createFullAdder,
  createHalfAdder,
  createNBitAdder,
  createS2,
  createS4,
} from '@/electron/circuit';
import { Executor } from '@/graph/executor';
import { Context } from '@/graph/index';
import { createStore } from '@/graph/nodes';

const executor = new Executor();
const ctx = new Context(executor);

beforeEach(() => {
  ctx.clear();
});

it('test CD4532', async () => {
  const CD4532 = createCD4532(ctx);
  const store = createStore(ctx, 'store', ['Y0', 'Y1', 'Y2']);

  ctx.connect(CD4532.Y0, 'output', store, 'Y0');
  ctx.connect(CD4532.Y1, 'output', store, 'Y1');
  ctx.connect(CD4532.Y2, 'output', store, 'Y2');

  ctx.emit(CD4532.I0, 'input', 1);
  ctx.emit(CD4532.I1, 'input', 1);
  ctx.emit(CD4532.I2, 'input', 1);
  ctx.emit(CD4532.I3, 'input', 0);
  ctx.emit(CD4532.I4, 'input', 0);
  ctx.emit(CD4532.I5, 'input', 0);
  ctx.emit(CD4532.I6, 'input', 0);
  ctx.emit(CD4532.I7, 'input', 0);

  ctx.emit(CD4532.EI, 'input', 1);

  await ctx.run();

  expect(store.state).toEqual({
    Y0: 0,
    Y1: 1,
    Y2: 0,
  });
});

it('test 8421BCD', async () => {
  const BCD8421 = createBCD8421(ctx);
  const result = createStore(ctx, 'result', [
    'Y0',
    'Y1',
    'Y2',
    'Y3',
    'Y4',
    'Y5',
    'Y6',
    'Y7',
    'Y8',
    'Y9',
  ]);

  ctx.connect(BCD8421.Y0, 'output', result, 'Y0');
  ctx.connect(BCD8421.Y1, 'output', result, 'Y1');
  ctx.connect(BCD8421.Y2, 'output', result, 'Y2');
  ctx.connect(BCD8421.Y3, 'output', result, 'Y3');
  ctx.connect(BCD8421.Y4, 'output', result, 'Y4');
  ctx.connect(BCD8421.Y5, 'output', result, 'Y5');
  ctx.connect(BCD8421.Y6, 'output', result, 'Y6');
  ctx.connect(BCD8421.Y7, 'output', result, 'Y7');
  ctx.connect(BCD8421.Y8, 'output', result, 'Y8');
  ctx.connect(BCD8421.Y9, 'output', result, 'Y9');

  ctx.emit(BCD8421.A0, 'input', 0);
  ctx.emit(BCD8421.A1, 'input', 1);
  ctx.emit(BCD8421.A2, 'input', 1);
  ctx.emit(BCD8421.A3, 'input', 0);

  await ctx.run();
  expect(result.state).toEqual({
    Y0: 1,
    Y1: 1,
    Y2: 1,
    Y3: 1,
    Y4: 1,
    Y5: 1,
    Y6: 0,
    Y7: 1,
    Y8: 1,
    Y9: 1,
  });

  ctx.emit(BCD8421.A2, 'input', 0);
  ctx.emit(BCD8421.A3, 'input', 1);
  await ctx.run();

  expect(result.state).toEqual({
    Y0: 1,
    Y1: 1,
    Y2: 1,
    Y3: 1,
    Y4: 1,
    Y5: 1,
    Y6: 1,
    Y7: 1,
    Y8: 1,
    Y9: 1,
  });

  ctx.emit(BCD8421.A0, 'input', 1);
  ctx.emit(BCD8421.A1, 'input', 0);
  ctx.emit(BCD8421.A3, 'input', 0);
  await ctx.run();

  expect(result.state).toEqual({
    Y0: 1,
    Y1: 0,
    Y2: 1,
    Y3: 1,
    Y4: 1,
    Y5: 1,
    Y6: 1,
    Y7: 1,
    Y8: 1,
    Y9: 1,
  });
});

it('test S2', async () => {
  const S2 = createS2(ctx);
  const store = createStore(ctx, 'Y', ['Y']);

  ctx.connect(S2.Y, 'output', store, 'Y');

  ctx.emit(S2.D0, 'input', 1);
  ctx.emit(S2.D1, 'input', 0);

  ctx.emit(S2.S, 'input', 0);
  await ctx.run();
  expect(store.state).toEqual({ Y: 1 });

  ctx.emit(S2.S, 'input', 1);
  await ctx.run();
  expect(store.state).toEqual({ Y: 0 });
});

it('test S4', async () => {
  const S4 = createS4(ctx);
  const store = createStore(ctx, 'Y', ['Y']);

  ctx.connect(S4.Y, 'output', store, 'Y');

  ctx.emit(S4.D0, 'input', 1);
  ctx.emit(S4.D1, 'input', 0);
  ctx.emit(S4.D2, 'input', 1);
  ctx.emit(S4.D3, 'input', 0);

  ctx.emit(S4.S0, 'input', 0);
  ctx.emit(S4.S1, 'input', 1);
  await ctx.run();
  expect(store.state).toEqual({ Y: 1 });

  ctx.emit(S4.S0, 'input', 1);
  ctx.emit(S4.S1, 'input', 1);
  await ctx.run();
  expect(store.state).toEqual({ Y: 0 });

  ctx.emit(S4.S0, 'input', 1);
  ctx.emit(S4.S1, 'input', 0);
  await ctx.run();
  expect(store.state).toEqual({ Y: 0 });
});

it('test HalfAdder', async () => {
  const halfAdder = createHalfAdder(ctx);
  const result = createStore(ctx, 'result', ['S', 'C']);

  ctx.connect(halfAdder.S, 'output', result, 'S');
  ctx.connect(halfAdder.C, 'output', result, 'C');

  ctx.emit(halfAdder.A, 'input', 1);
  ctx.emit(halfAdder.B, 'input', 1);
  await ctx.run();
  expect(result.state).toEqual({ S: 0, C: 1 });

  ctx.emit(halfAdder.A, 'input', 1);
  ctx.emit(halfAdder.B, 'input', 0);
  await ctx.run();
  expect(result.state).toEqual({ S: 1, C: 0 });
});

it('test FullAdder', async () => {
  const fullAdder = createFullAdder(ctx);
  const result = createStore(ctx, 'result', ['S', 'Cout']);

  ctx.connect(fullAdder.S, 'output', result, 'S');
  ctx.connect(fullAdder.Cout, 'output', result, 'Cout');

  ctx.emit(fullAdder.A, 'input', 1);
  ctx.emit(fullAdder.B, 'input', 0);
  ctx.emit(fullAdder.Cin, 'input', 1);

  await ctx.run();
  expect(result.state).toEqual({ S: 0, Cout: 1 });
});

it('test NBitAdder', async () => {
  const adders = createNBitAdder(ctx);
  const result = createStore(ctx, 'result', ['S0', 'S1', 'S2', 'S3', 'Cout']);

  ctx.connect(adders[0].S, 'output', result, 'S0');
  ctx.connect(adders[1].S, 'output', result, 'S1');
  ctx.connect(adders[2].S, 'output', result, 'S2');
  ctx.connect(adders[3].S, 'output', result, 'S3');
  ctx.connect(adders[3].Cout, 'output', result, 'Cout');

  // 1101 + 1100 = 1001
  ctx.emit(adders[0].Cin, 'input', 0);
  ctx.emit(adders[0].A, 'input', 1);
  ctx.emit(adders[1].A, 'input', 0);
  ctx.emit(adders[2].A, 'input', 1);
  ctx.emit(adders[3].A, 'input', 1);
  ctx.emit(adders[0].B, 'input', 0);
  ctx.emit(adders[1].B, 'input', 0);
  ctx.emit(adders[2].B, 'input', 1);
  ctx.emit(adders[3].B, 'input', 1);

  await ctx.run();
  expect(result.state).toEqual({
    S0: 1,
    S1: 0,
    S2: 0,
    S3: 1,
    Cout: 1,
  });

  // 1101 + 1100 + 1 = 1101 - 0011 = 1010
  ctx.emit(adders[0].Cin, 'input', 1);

  await ctx.run();
  expect(result.state).toEqual({
    S0: 0,
    S1: 1,
    S2: 0,
    S3: 1,
    Cout: 1,
  });
});
