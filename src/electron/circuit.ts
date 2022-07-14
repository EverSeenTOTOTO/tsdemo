import { IContext } from '@/graph';
import { PipeNode } from '@/graph/nodes';
import { createComponent } from './component';
import { OrNotGate } from './gate';

// CD4532 优先编码器
export function createCD4532(ctx: IContext) {
  const Y2 = createComponent('E(I7+I6+I5+I4)', ctx);
  const Y1 = createComponent('E(I7+I6+~I5~I4I3+~I5~I4I2)', ctx);
  const Y0 = createComponent('E(I7+~I6I5+~I6~I4I3+~I6~I4~I2I1)', ctx);
  const EO = createComponent('E(~I7~I6~I5~I4~I3~I2~I1~I0)', ctx);
  const GS = createComponent('E(I7+I6+I5+I4+I3+I2+I1+I0)', ctx);

  const EI = ctx.getNode('E')!;
  const I0 = ctx.getNode('I0')!;
  const I1 = ctx.getNode('I1')!;
  const I2 = ctx.getNode('I2')!;
  const I3 = ctx.getNode('I3')!;
  const I4 = ctx.getNode('I4')!;
  const I5 = ctx.getNode('I5')!;
  const I6 = ctx.getNode('I6')!;
  const I7 = ctx.getNode('I7')!;

  return {
    Y2, Y1, Y0, EO, GS, EI, I0, I1, I2, I3, I4, I5, I6, I7,
  };
}

// 8421BCD 译码器
export function createBCD8421(ctx: IContext) {
  const Y0 = createComponent('~(~A3~A2~A1~A0)', ctx);
  const Y1 = createComponent('~(~A3~A2~A1A0)', ctx);
  const Y2 = createComponent('~(~A3~A2A1~A0)', ctx);
  const Y3 = createComponent('~(~A3~A2A1A0)', ctx);
  const Y4 = createComponent('~(~A3A2~A1~A0)', ctx);
  const Y5 = createComponent('~(~A3A2~A1A0)', ctx);
  const Y6 = createComponent('~(~A3A2A1~A0)', ctx);
  const Y7 = createComponent('~(~A3A2A1A0)', ctx);
  const Y8 = createComponent('~(A3~A2~A1~A0)', ctx);
  const Y9 = createComponent('~(A3~A2~A1A0)', ctx);

  const A0 = ctx.getNode('A0')!;
  const A1 = ctx.getNode('A1')!;
  const A2 = ctx.getNode('A2')!;
  const A3 = ctx.getNode('A3')!;

  return {
    Y0, Y1, Y2, Y3, Y4, Y5, Y6, Y7, Y8, Y9, A0, A1, A2, A3,
  };
}

// 二路选择器
export function createS2(ctx: IContext) {
  const Y = createComponent('~SD0+SD1', ctx);

  const S = ctx.getNode('S')!;
  const D0 = ctx.getNode('D0')!;
  const D1 = ctx.getNode('D1')!;

  return {
    Y, S, D0, D1,
  };
}

// 四路选择器
export function createS4(ctx: IContext) {
  const Y = createComponent('~S1~S0D0+~S1S0D1+S1~S0D2+S1S0D3', ctx);

  const S0 = ctx.getNode('S0')!;
  const S1 = ctx.getNode('S1')!;
  const D0 = ctx.getNode('D0')!;
  const D1 = ctx.getNode('D1')!;
  const D2 = ctx.getNode('D2')!;
  const D3 = ctx.getNode('D3')!;

  return {
    Y, S0, S1, D0, D1, D2, D3,
  };
}

// 半加器
export function createHalfAdder(ctx: IContext) {
  const S = createComponent('~AB+A~B', ctx);
  const C = createComponent('AB', ctx);

  const A = ctx.getNode('A')!;
  const B = ctx.getNode('B')!;

  return {
    S, C, A, B,
  };
}

// 全加器
export function createFullAdder(ctx: IContext) {
  const S = createComponent('~A~BC+~AB~C+A~B~C+ABC', ctx);
  const Cout = createComponent('AB+A~BC+~ABC', ctx);

  const A = ctx.getNode('A')!;
  const B = ctx.getNode('B')!;
  const Cin = ctx.getNode('C')!;

  return {
    S, Cout, A, B, Cin,
  };
}

// 或非门SR锁存器
export function createSR(ctx: IContext) {
  const G1 = new OrNotGate('G1');
  const G2 = new OrNotGate('G2');

  ctx.addNodes(G1, G2);

  const R = new PipeNode('R');
  const S = new PipeNode('S');
  const Q = new PipeNode('Q');
  const N = new PipeNode('N');

  ctx.addNodes(R, S, Q, N);

  ctx.connect(R, 'output', G1, 'lhs');
  ctx.connect(G2, 'output', G1, 'rhs');
  ctx.connect(G1, 'output', Q, 'input');
  ctx.connect(S, 'output', G2, 'rhs');
  ctx.connect(G1, 'output', G2, 'lhs');
  ctx.connect(G2, 'output', N, 'input');

  return {
    R, S, Q, N,
  };
}
