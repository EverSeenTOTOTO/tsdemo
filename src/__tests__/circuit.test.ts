import {
  createBCD8421, createCD4532, createS2, createS4,
} from '@/electron/circuit';
import { Executor } from '@/graph/executor';
import {
  Context, Node, Slot,
} from '@/graph/index';
import { LoggerNode, LogLevel } from '@/graph/nodes';

const executor = new Executor();
const ctx = new Context(executor);
const logger = new LoggerNode('Z', LogLevel.error);
const info = jest.spyOn(console, 'info').mockImplementation(() => { });
const warn = jest.spyOn(console, 'warn').mockImplementation(() => { });
const error = jest.spyOn(console, 'error').mockImplementation(() => { });

beforeEach(() => {
  ctx.reset();
  info.mockClear();
});

it('test CD4532', async () => {
  const CD4532 = createCD4532(ctx);

  ctx.connect(CD4532.Y0, 'output', logger, 'info');
  ctx.connect(CD4532.Y1, 'output', logger, 'warn');
  ctx.connect(CD4532.Y2, 'output', logger, 'error');

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

  expect(info).toHaveBeenNthCalledWith(1, 'Z: 0');
  expect(warn).toHaveBeenNthCalledWith(1, 'Z: 1');
  expect(error).toHaveBeenNthCalledWith(1, 'Z: 0');
});

it('test 8421BCD', async () => {
  class StoreNode extends Node<string, number, number> {
    constructor(name: string) {
      super(name);
      this.slots = [
        new Slot('Y0', this),
        new Slot('Y1', this),
        new Slot('Y2', this),
        new Slot('Y3', this),
        new Slot('Y4', this),
        new Slot('Y5', this),
        new Slot('Y6', this),
        new Slot('Y7', this),
        new Slot('Y8', this),
        new Slot('Y9', this),
      ];
    }

    values: Record<string, number> = {};

    emit(slot: string, value: number) {
      this.values[slot] = value;
    }
  }
  const BCD8421 = createBCD8421(ctx);
  const result = new StoreNode('result');

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
  expect(result.values).toEqual({
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

  expect(result.values).toEqual({
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

  expect(result.values).toEqual({
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

  ctx.connect(S2.Y, 'output', logger, 'info');

  ctx.emit(S2.D0, 'input', 1);
  ctx.emit(S2.D1, 'input', 0);

  ctx.emit(S2.S, 'input', 0);
  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(1, 'Z: 1'); // select D0

  ctx.emit(S2.S, 'input', 1);
  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(2, 'Z: 0'); // select D1
});

it('test S4', async () => {
  const S4 = createS4(ctx);

  ctx.connect(S4.Y, 'output', logger, 'info');

  ctx.emit(S4.D0, 'input', 1);
  ctx.emit(S4.D1, 'input', 0);
  ctx.emit(S4.D2, 'input', 1);
  ctx.emit(S4.D3, 'input', 0);

  ctx.emit(S4.S0, 'input', 0);
  ctx.emit(S4.S1, 'input', 0);
  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(1, 'Z: 1'); // select D0

  ctx.emit(S4.S1, 'input', 1);
  await ctx.run();
  expect(info).toHaveBeenNthCalledWith(2, 'Z: 1'); // select D2
});
