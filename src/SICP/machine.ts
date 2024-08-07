/* eslint-disable max-classes-per-file */

type PrimitiveConst = ['const', any];
type PrimitiveLabel = ['label', string];
type PrimitiveReg = ['reg', string];
type PrimitiveOp = ['op', string];

type PrimitiveInst = PrimitiveConst | PrimitiveReg | PrimitiveLabel;

type AssignInst =
  | ['assign', string, PrimitiveInst]
  | ['assign', string, PrimitiveOp, ...PrimitiveInst[]];

type TestInst = ['test', PrimitiveOp, ...PrimitiveInst[]];

type BranchInst = ['branch', PrimitiveLabel | PrimitiveReg];

type GotoInst = ['goto', PrimitiveLabel | PrimitiveReg];

type SaveInst = ['save', string];

type RestoreInst = ['restore', string];

type PerformInst = ['perform', PrimitiveOp, ...PrimitiveInst[]];

export type Instruction =
  | AssignInst
  | TestInst
  | BranchInst
  | GotoInst
  | SaveInst
  | RestoreInst
  | PerformInst;

export type InstructionNames = Instruction[0];

type CompiledInstruction = [InstructionNames, Operation];

type LabelPosition = [symbol, number];

export type Operation = (...args: any[]) => any;
export type Operations = [string, Operation][];

export type AssembleCode = (Instruction | symbol)[];

const getLabel = (label: any) => {
  return typeof label === 'symbol' ? label.description : label;
};

const lookupLabel = (labels: LabelPosition[], lbl: string) => {
  const lbls = labels.filter(label => {
    if (Array.isArray(label) && typeof label[0] === 'symbol') {
      return label[0].description === lbl;
    }

    throw new Error(`Invalid label ${lbl}`);
  });

  if (lbls.length > 1) {
    throw new Error(`Duplicate label ${lbl}`);
  }

  const [[, pos]] = lbls;

  return pos;
};

const makePrimitiveExp = (
  exp: PrimitiveInst,
  labels: LabelPosition[],
  machine: Machine,
) => {
  const [type, input] = exp; // [<const|reg> <input>]

  switch (type) {
    case 'const':
      return () => input;
    case 'label':
      return () => lookupLabel(labels, input);
    case 'reg':
      return () => machine.getRegisterContent(input);
    default:
      throw new Error(`Unknown primitive ${getLabel(type)}`);
  }
};

const makeOperationExp = (
  exp: [PrimitiveOp, ...PrimitiveInst[]],
  labels: LabelPosition[],
  machine: Machine,
) => {
  const [[, op], ...input] = exp; // [op <op>] <input> ...

  const operation = machine.getOperation(op);
  const callbacks = input.map((arg: any) =>
    makePrimitiveExp(arg, labels, machine),
  );

  return () => operation(...callbacks.map(cb => cb()));
};

const makeAssign = (
  inst: AssignInst,
  labels: LabelPosition[],
  machine: Machine,
) => {
  const [, name, ...valueExp] = inst;
  const register = machine.getRegister(name);

  const valueProc =
    valueExp[0][0] === 'op'
      ? makeOperationExp(
          valueExp as [PrimitiveOp, ...PrimitiveInst[]],
          labels,
          machine,
        ) // assign <reg> [op <op>] <input> ...
      : makePrimitiveExp(valueExp[0], labels, machine); // assign <reg> [<const|reg> <input>]

  return () => {
    register.set(valueProc());
    machine.advancePC();
  };
};

const makeTest = (
  inst: TestInst,
  labels: LabelPosition[],
  machine: Machine,
) => {
  const [, ...condition] = inst;

  if (condition[0][0] === 'op') {
    // test [<op> <input>] ...
    const proc = makeOperationExp(condition, labels, machine);

    return () => {
      machine.setRegisterContent('flag', proc());
      machine.advancePC();
    };
  }

  throw new Error(`Invalid test ${getLabel(condition[0])}`);
};

const makeBranch = (
  inst: BranchInst,
  labels: LabelPosition[],
  machine: Machine,
) => {
  const [, [dest, lbl]] = inst;

  if (dest === 'label') {
    // branch [label <lbl>]
    return () => {
      const pos = lookupLabel(labels, lbl);

      // 上一次test的结果会被存在flag里面
      if (machine.getRegisterContent('flag')) {
        machine.setRegisterContent('pc', pos);
      } else {
        machine.advancePC();
      }
    };
  }

  throw new Error(`Invalid branch ${getLabel(dest)}`);
};

const makeGoto = (
  inst: GotoInst,
  labels: LabelPosition[],
  machine: Machine,
) => {
  const [, [dest, lbl]] = inst;

  if (dest === 'label') {
    // goto [label <lbl>]
    return () => {
      const pos = lookupLabel(labels, lbl);

      machine.setRegisterContent('pc', pos);
    };
  }

  if (dest === 'reg') {
    // goto [reg <reg>]
    return () => {
      const reg = machine.getRegister(lbl);

      machine.setRegisterContent('pc', reg.get());
    };
  }

  throw new Error(`Invalid goto ${getLabel(dest)}`);
};

const makeSave = (
  inst: SaveInst,
  _labels: LabelPosition[],
  machine: Machine,
) => {
  const [, reg] = inst;

  if (typeof reg === 'string') {
    // save <reg>
    return () => {
      const content = machine.getRegisterContent(reg);

      machine.pushStack(content);
      machine.advancePC();
    };
  }

  throw new Error(`Invalid save ${getLabel(reg)}`);
};

const makeRestore = (
  inst: RestoreInst,
  _labels: LabelPosition[],
  machine: Machine,
) => {
  const [, reg] = inst;

  if (typeof reg === 'string') {
    // restore <reg>
    return () => {
      const content = machine.popStack();

      machine.setRegisterContent(reg, content);
      machine.advancePC();
    };
  }

  throw new Error(`Invalid restore ${getLabel(reg)}`);
};

const makePerform = (
  inst: PerformInst,
  labels: LabelPosition[],
  machine: Machine,
) => {
  const [, [op, oprand], ...input] = inst; // perform [op <op>] <input> ...

  if (op === 'op') {
    const operation = machine.getOperation(oprand);
    const callbacks = input.map((arg: any) =>
      makePrimitiveExp(arg, labels, machine),
    );

    return () => {
      operation(...callbacks.map(cb => cb()));
      machine.advancePC();
    };
  }

  throw new Error(`Invalid perform ${getLabel(op)}`);
};

const makeExecutionProcedure = (
  inst: Instruction,
  labels: LabelPosition[],
  machine: Machine,
) => {
  switch (inst[0]) {
    case 'assign':
      return makeAssign(inst, labels, machine);
    case 'test':
      return makeTest(inst, labels, machine);
    case 'branch':
      return makeBranch(inst, labels, machine);
    case 'goto':
      return makeGoto(inst, labels, machine);
    case 'save':
      return makeSave(inst, labels, machine);
    case 'restore':
      return makeRestore(inst, labels, machine);
    case 'perform':
      return makePerform(inst, labels, machine);
    default:
      throw new Error(`Unknown instruction ${getLabel(inst[0])}`);
  }
};

const assemble = (code: AssembleCode, machine: Machine) => {
  const labels: LabelPosition[] = [];
  const compiledInsts: CompiledInstruction[] = [];

  for (const inst of code) {
    if (typeof inst === 'symbol') {
      labels.push([inst, code.indexOf(inst) - labels.length]); // 记录label在指令中的位置，但是要减去已经出现的label数量，因为编译后的指令序列不含label
    } else {
      compiledInsts.push([
        inst[0],
        makeExecutionProcedure(inst, labels, machine),
      ]);
    }
  }

  return compiledInsts;
};

export class Register<T> {
  name: string;

  value?: T;

  constructor(name: string) {
    this.name = name;
  }

  get() {
    return this.value;
  }

  set(value: T) {
    this.value = value;
  }
}

export class Machine {
  flag: Register<boolean>;

  stack: any[];

  pc: Register<number>;

  instructions: CompiledInstruction[];

  registers: Map<string, Register<any>>;

  operations: Map<string, Operation>;

  constructor(registerNames: string[], ops: Operations, code: AssembleCode) {
    this.pc = new Register('pc');
    this.flag = new Register('flag');
    this.stack = [];
    this.operations = new Map(ops);
    this.registers = new Map<string, Register<any>>([
      ['pc', this.pc],
      ['flag', this.flag],
    ]);

    for (const name of registerNames) {
      this.allocateRegister(name);
    }

    this.instructions = assemble(code, this);
  }

  start() {
    this.pc.set(0);

    const runToEnd = () => {
      const pos = this.pc.get();

      if (typeof pos === 'number' && pos < this.instructions.length) {
        this.step();
        runToEnd();
      }
    };

    runToEnd();
  }

  private step() {
    const pos = this.pc.get();
    const [, proc] = this.instructions.slice(pos)[0];

    proc();
  }

  advancePC() {
    const pos = this.pc.get();

    if (typeof pos !== 'number') {
      throw new Error(`Invalid pc: ${pos}`);
    }

    if (pos < this.instructions.length) {
      this.pc.set(pos + 1);
    }
  }

  pushStack(content: any) {
    this.stack.push(content);
  }

  popStack() {
    return this.stack.pop();
  }

  allocateRegister(name: string) {
    if (this.registers.get(name)) {
      throw new Error(`Register ${name} already exists`);
    }

    this.registers.set(name, new Register(name));
  }

  getOperation(name: string) {
    const operation = this.operations.get(name);

    if (!operation) {
      throw new Error(`Operation ${name} does not exist`);
    }

    return operation;
  }

  getRegister(name: string) {
    const register = this.registers.get(name);

    if (!register) {
      throw new Error(`Register ${name} does not exist`);
    }

    return register;
  }

  getRegisterContent(name: string) {
    return this.getRegister(name).get();
  }

  setRegisterContent(name: string, value: any) {
    return this.getRegister(name).set(value);
  }
}
