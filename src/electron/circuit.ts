import { IContext } from '@/graph';
import { PipeNode } from '@/graph/nodes';
import { uuid } from '@/utils';
import { createComponent } from './component';
import { AndGate, NotGate, OrGate, OrNotGate, TGate } from './gate';

class PipeGate extends PipeNode<1 | 0, 1 | 0> {}

// CD4532 优先编码器
export function createCD4532(ctx: IContext) {
  const seed = uuid(); // avoid conflict name
  const e = `E${seed}`;
  const i0 = `I0${seed}`;
  const i1 = `I1${seed}`;
  const i2 = `I2${seed}`;
  const i3 = `I3${seed}`;
  const i4 = `I4${seed}`;
  const i5 = `I5${seed}`;
  const i6 = `I6${seed}`;
  const i7 = `I7${seed}`;

  const Y2 = createComponent(`${e}(${i7}+${i6}+${i5}+${i4})`, ctx);
  const Y1 = createComponent(
    `${e}(${i7}+${i6}+~${i5}~${i4}${i3}+~${i5}~${i4}${i2})`,
    ctx,
  );
  const Y0 = createComponent(
    `${e}(${i7}+~${i6}${i5}+~${i6}~${i4}${i3}+~${i6}~${i4}~${i2}${i1})`,
    ctx,
  );
  const EO = createComponent(
    `${e}(~${i7}~${i6}~${i5}~I4~${i3}~${i2}~${i1}~${i0})`,
    ctx,
  );
  const GS = createComponent(
    `${e}(${i7}+${i6}+${i5}+${i4}+${i3}+${i2}+${i1}+${i0})`,
    ctx,
  );

  const EI = ctx.getNode(e)!;
  const I0 = ctx.getNode(i0)!;
  const I1 = ctx.getNode(i1)!;
  const I2 = ctx.getNode(i2)!;
  const I3 = ctx.getNode(i3)!;
  const I4 = ctx.getNode(i4)!;
  const I5 = ctx.getNode(i5)!;
  const I6 = ctx.getNode(i6)!;
  const I7 = ctx.getNode(i7)!;

  return {
    Y2,
    Y1,
    Y0,
    EO,
    GS,
    EI,
    I0,
    I1,
    I2,
    I3,
    I4,
    I5,
    I6,
    I7,
  };
}

// 8421BCD 译码器
export function createBCD8421(ctx: IContext) {
  const seed = uuid();
  const a0 = `A0${seed}`;
  const a1 = `A1${seed}`;
  const a2 = `A2${seed}`;
  const a3 = `A3${seed}`;

  const Y0 = createComponent(`~(~${a3}~${a2}~${a1}~${a0})`, ctx);
  const Y1 = createComponent(`~(~${a3}~${a2}~${a1}${a0})`, ctx);
  const Y2 = createComponent(`~(~${a3}~${a2}${a1}~${a0})`, ctx);
  const Y3 = createComponent(`~(~${a3}~${a2}${a1}${a0})`, ctx);
  const Y4 = createComponent(`~(~${a3}${a2}~${a1}~${a0})`, ctx);
  const Y5 = createComponent(`~(~${a3}${a2}~${a1}${a0})`, ctx);
  const Y6 = createComponent(`~(~${a3}${a2}${a1}~${a0})`, ctx);
  const Y7 = createComponent(`~(~${a3}${a2}${a1}${a0})`, ctx);
  const Y8 = createComponent(`~(${a3}~${a2}~${a1}~${a0})`, ctx);
  const Y9 = createComponent(`~(${a3}~${a2}~${a1}${a0})`, ctx);

  const A0 = ctx.getNode(a0)!;
  const A1 = ctx.getNode(a1)!;
  const A2 = ctx.getNode(a2)!;
  const A3 = ctx.getNode(a3)!;

  return {
    Y0,
    Y1,
    Y2,
    Y3,
    Y4,
    Y5,
    Y6,
    Y7,
    Y8,
    Y9,
    A0,
    A1,
    A2,
    A3,
  };
}

// 二路选择器
export function createS2(ctx: IContext) {
  const seed = uuid();
  const s = `S${seed}`;
  const d0 = `D0${seed}`;
  const d1 = `D1${seed}`;
  const Y = createComponent(`~${s}${d0}+${s}${d1}`, ctx);

  const S = ctx.getNode(s)!;
  const D0 = ctx.getNode(d0)!;
  const D1 = ctx.getNode(d1)!;

  return {
    Y,
    S,
    D0,
    D1,
  };
}

// 四路选择器
export function createS4(ctx: IContext) {
  const seed = uuid();
  const s0 = `S0${seed}`;
  const s1 = `S1${seed}`;
  const d0 = `D0${seed}`;
  const d1 = `D1${seed}`;
  const d2 = `D2${seed}`;
  const d3 = `D3${seed}`;

  const Y = createComponent(
    `~${s1}~${s0}${d0}+~${s1}${s0}${d1}+${s1}~${s0}${d2}+${s1}${s0}${d3}`,
    ctx,
  );

  const S0 = ctx.getNode(s0)!;
  const S1 = ctx.getNode(s1)!;
  const D0 = ctx.getNode(d0)!;
  const D1 = ctx.getNode(d1)!;
  const D2 = ctx.getNode(d2)!;
  const D3 = ctx.getNode(d3)!;

  return {
    Y,
    S0,
    S1,
    D0,
    D1,
    D2,
    D3,
  };
}

// 半加器
export function createHalfAdder(ctx: IContext) {
  const seed = uuid();
  const a = `A${seed}`;
  const b = `B${seed}`;

  const S = createComponent(`~${a}${b}+${a}~${b}`, ctx);
  const C = createComponent(`${a}${b}`, ctx);

  const A = ctx.getNode(a)!;
  const B = ctx.getNode(b)!;

  return {
    S,
    C,
    A,
    B,
  };
}

// 全加器
export function createFullAdder(ctx: IContext) {
  const seed = uuid();
  const a = `A${seed}`;
  const b = `B${seed}`;
  const c = `C${seed}`;

  const S = createComponent(
    `~${a}~${b}${c}+~${a}${b}~${c}+${a}~${b}~${c}+${a}${b}${c}`,
    ctx,
  );
  const Cout = createComponent(`${a}${b}+${a}~${b}${c}+~${a}${b}${c}`, ctx);

  const A = ctx.getNode(a)!;
  const B = ctx.getNode(b)!;
  const Cin = ctx.getNode(c)!;

  return {
    S,
    Cout,
    A,
    B,
    Cin,
  };
}

// n位级联加法器，进位设1可做减法
export function createNBitAdder(ctx: IContext, n = 4) {
  const adders: ReturnType<typeof createFullAdder>[] = [];

  for (let i = 0; i < n; ++i) {
    const adder = createFullAdder(ctx);

    adders.push(adder);

    if (adders[i - 1]) {
      ctx.connect(adders[i - 1].Cout, 'output', adder.Cin, 'input');
    }
  }

  return adders;
}

// 或非门SR锁存器
export function createSR(ctx: IContext) {
  const seed = uuid();
  const G1 = new OrNotGate(`G1${seed}`);
  const G2 = new OrNotGate(`G2${seed}`);

  ctx.addNodes(G1, G2);

  const R = new PipeGate(`R${seed}`);
  const S = new PipeGate(`S${seed}`);
  const Q = new PipeGate(`Q${seed}`);
  const N = new PipeGate(`N${seed}`);

  ctx.addNodes(R, S, Q, N);

  ctx.connect(R, 'output', G1, 'lhs');
  ctx.connect(G2, 'output', G1, 'rhs');
  ctx.connect(G1, 'output', Q, 'input');
  ctx.connect(S, 'output', G2, 'rhs');
  ctx.connect(G1, 'output', G2, 'lhs');
  ctx.connect(G2, 'output', N, 'input');

  return {
    R,
    S,
    Q,
    N,
  };
}

// 门控SR锁存器
export function createGSR(ctx: IContext) {
  const seed = uuid();
  const G4 = new AndGate(`G4${seed}`);
  const G3 = new AndGate(`G3${seed}`);
  const R = new PipeGate(`R${seed}`);
  const S = new PipeGate(`S${seed}`);
  const E = new PipeGate(`E${seed}`);

  ctx.addNodes(G3, G4, R, S, E);

  const SR = createSR(ctx);

  ctx.connect(R, 'output', G4, 'lhs');
  ctx.connect(E, 'output', G4, 'rhs');
  ctx.connect(E, 'output', G3, 'lhs');
  ctx.connect(S, 'output', G3, 'rhs');
  ctx.connect(G4, 'output', SR.R, 'input');
  ctx.connect(G3, 'output', SR.S, 'input');

  return {
    R,
    E,
    S,
    Q: SR.Q,
    N: SR.N,
  };
}

// 传输门控D锁存器，无使能部分
function createTGD(ctx: IContext) {
  const seed = uuid();
  const TG1 = new TGate(`TG1${seed}`);
  const TG2 = new TGate(`TG2${seed}`);
  const G1 = new NotGate(`G1${seed}`);
  const G2 = new NotGate(`G2${seed}`);

  ctx.addNodes(TG1, TG2, G1, G2);

  const D = new PipeGate(`D${seed}`);
  const Q = new PipeGate(`Q${seed}`);
  const N = new PipeGate(`N${seed}`);

  ctx.addNodes(D, Q, N);

  ctx.connect(D, 'output', TG1, 'lhs');
  ctx.connect(TG1, 'rhs', G1, 'input');
  ctx.connect(TG1, 'rhs', TG2, 'lhs');
  ctx.connect(G1, 'output', N, 'input');
  ctx.connect(G1, 'output', G2, 'input');
  ctx.connect(TG2, 'rhs', Q, 'input');
  ctx.connect(G2, 'output', Q, 'input');
  ctx.connect(G2, 'output', TG2, 'rhs');
  ctx.connect(TG2, 'lhs', G1, 'input');

  return {
    D,
    Q,
    N,
    TG1,
    TG2,
  };
}

// 传输门控D锁存器
export function createD(ctx: IContext) {
  const seed = uuid();
  const G3 = new NotGate(`G3${seed}`);
  const G4 = new NotGate(`G4${seed}`);
  const E = new PipeGate(`E${seed}`);

  ctx.addNodes(E, G3, G4);

  const D = createTGD(ctx);

  ctx.connect(E, 'output', G3, 'input');
  ctx.connect(G3, 'output', G4, 'input');
  ctx.connect(G3, 'output', D.TG2, 'ctrl');
  ctx.connect(G4, 'output', D.TG1, 'ctrl');

  return {
    E,
    D: D.D,
    Q: D.Q,
    N: D.N,
  };
}

// 主从D触发器
export function createDT(ctx: IContext) {
  const seed = uuid();
  const G5 = new NotGate(`G5${seed}`);
  const G6 = new NotGate(`G6${seed}`);
  const E = new PipeGate(`E${seed}`);
  const N = new PipeGate(`N${seed}`);

  ctx.addNodes(E, G5, G6, N);

  const DM = createTGD(ctx); // 主
  const DS = createTGD(ctx); // 从

  ctx.connect(DS.TG1, 'rhs', N, 'input');
  ctx.connect(DS.TG2, 'lhs', N, 'input');
  ctx.connect(DM.N, 'output', DS.D, 'input');
  ctx.connect(E, 'output', G5, 'input');
  ctx.connect(G5, 'output', G6, 'input');
  ctx.connect(G5, 'output', DM.TG1, 'ctrl');
  ctx.connect(G6, 'output', DM.TG2, 'ctrl');
  ctx.connect(G5, 'output', DS.TG2, 'ctrl');
  ctx.connect(G6, 'output', DS.TG1, 'ctrl');

  return {
    E,
    D: DM.D,
    Q: DS.N,
    N,
  };
}

// JK触发器, not tested
export function createJK(ctx: IContext) {
  const seed = uuid();
  const G1 = new NotGate(`G1${seed}`);
  const G2 = new AndGate(`G2${seed}`);
  const G3 = new AndGate(`G3${seed}`);
  const G4 = new OrGate(`G4${seed}`);
  const J = new PipeGate(`J${seed}`);
  const K = new PipeGate(`K${seed}`);

  ctx.addNodes(G1, G2, G3, G4, J, K);

  const D = createDT(ctx);

  ctx.connect(J, 'output', G3, 'rhs');
  ctx.connect(D.N, 'output', G3, 'lhs');
  ctx.connect(G3, 'output', G4, 'lhs');
  ctx.connect(K, 'output', G1, 'input');
  ctx.connect(G1, 'output', G2, 'lhs');
  ctx.connect(D.Q, 'output', G2, 'rhs');
  ctx.connect(G2, 'output', G4, 'rhs');
  ctx.connect(G4, 'output', D.D, 'input');

  return {
    J,
    K,
    Q: D.Q,
    N: D.N,
    E: D.E,
  };
}
