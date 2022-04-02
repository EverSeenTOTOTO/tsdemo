/* eslint-disable max-classes-per-file */
import Table from 'cli-table';
import { ExtendMap, ExtendSet, flattern } from '@/utils';
import {
  Input,
  State,
  InputSet,
  StateSet,
} from './FiniteStateMachine';

export class PDAStack<I extends Input = Input> extends Array<I> {
  replace(input: I) {
    this.pop();
    this.push(input);
  }
}
// 栈字母表与输入字母表合二为一均用Input表达
// 系统状态 + 输入 = [系统状态，旧栈顶，待操作字符]
// 输入 = ε 表示不读取输入
// [系统状态，ε, x] 表示压入字符x
// [系统状态，x, ε] 表示弹出字符x
// [系统状态，x, y] 表示弹出字符x，压入字符y
export type PDARecord<S extends State = State, I extends Input = Input> = [S, I, I];
export class PDATransform<S extends State = State, I extends Input = Input> extends ExtendMap<I, ExtendSet<PDARecord<S, I>>> {}
export class PDATransformTable<S extends State = State, I extends Input = Input> extends ExtendMap<S, PDATransform<S, I>> {}

// 非确定性的
export class PushdownAutomaton<S extends State = State, I extends Input = Input> {
  readonly name: string;

  readonly transforms: PDATransformTable<S, I>;

  readonly initialState: S;

  readonly finalStates: StateSet<S>;

  constructor(name: string, transforms: PDATransformTable<S, I>, initialState: S, finalStates: StateSet<S>) {
    this.name = name;
    this.initialState = initialState;
    this.finalStates = finalStates;
    this.transforms = transforms;
  }

  get stateSet(): StateSet<S> {
    return new StateSet<S>([
      this.initialState,
      ...[...this.transforms.keys()].map((state) => state),
      ...this.finalStates.vs(),
    ].sort((a, b) => (a.name < b.name ? -1 : 0)));
  }

  get inputSet(): InputSet<I> {
    return new InputSet<I>(flattern(this.transforms.vs()
      .map((transform) => [...transform.keys()].sort((a, b) => (a.name < b.name ? -1 : 0)))));
  }

  isFinal(state: S) {
    return this.finalStates.has(state);
  }

  // 给定当前状态、栈顶和输入，获取下一个[状态，栈顶]集合
  next(input: I, state?: S): ExtendSet<PDARecord<S, I>> {
    const currentState = state ?? this.initialState;
    const transform = this.transforms.get(currentState);

    return transform?.get(input) ?? new ExtendSet<PDARecord<S, I>>();
  }

  toString() {
    const inputs = this.inputSet.vs().sort((a, b) => (a.name < b.name ? -1 : 0));
    const transformTable = new Table({
      rows: flattern(this.transforms.ks().map((state) => {
        const transform = this.transforms.get(state);
        return transform!.ks().map((input) => {
          const next = transform!.get(input);
          return next!.vs().map((result) => {
            return `${state.name} + [${input.name},${result[1].name}->${result[2].name}] = ${result[0].name}`;
          });
        });
      }))
        .map((x) => [x]),
    });
    const table = new Table({
      rows: [
        ['PDA', this.name],
        ['inputSet', `${inputs.map((input) => input.name).join(', ')}`],
        ['stateSet', `${this.stateSet.vs().map((state) => state.name).join(', ')}`],
        ['finalStates', `${this.finalStates.vs().map((state) => state.name).join(', ')}`],
        ['transforms', transformTable],
      ],
    });

    return table.toString();
  }
}

export class PDARunner<S extends State, I extends Input> {
  stack: PDAStack<I>;

  currentState: S;

  constructor(public pda: PushdownAutomaton<S, I>) {
    this.stack = new PDAStack();
    this.currentState = pda.initialState;
  }

  push(input: I) {
    this.stack.push(input);
  }

  top() {
    return this.stack[this.stack.length - 1];
  }

  pop() {
    this.stack.pop();
  }

  replace(input: I) {
    this.stack.replace(input);
  }

  dollar() {
    return this.stack.length === 1 && this.top() === Input.$;
  }

  empty() {
    return this.stack.length === 0;
  }
}
