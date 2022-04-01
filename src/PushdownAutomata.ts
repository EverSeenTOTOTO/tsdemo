/* eslint-disable max-classes-per-file */
import Table from 'cli-table';
import { ExtendMap, ExtendSet, flattern } from '@/utils';
import {
  Input,
  State,
  InputSet,
  StateSet,
} from './FiniteStateMachine';

export class PDAStack<I extends Input = Input> extends Array<I> {}
// 栈字母表与输入字母表合二为一均用Input表达
// [系统状态，栈顶]
export type PDARecord<S extends State = State, I extends Input = Input> = [S, I];
export class PDATransform<S extends State = State, I extends Input = Input> extends ExtendMap<I, ExtendSet<PDARecord<S, I>>> {}
export class PDATransformTable<S extends State = State, I extends Input = Input> extends ExtendMap<PDARecord<S, I>, PDATransform<S, I>> {
  // 重写get
  get(record: PDARecord<S, I>) {
    const result = super.get(record);

    if (!result) {
      for (const [key, value] of this) {
        if (key[0] === record[0] && key[1] === record[1]) {
          return value;
        }
      }
    }

    return result;
  }
}

// 非确定性的
export class PushdownAutomaton<S extends State = State, I extends Input = Input> {
  readonly name: string;

  readonly transforms: PDATransformTable<S, I>;

  readonly initialState: S;

  readonly finalStates: StateSet<S>;

  readonly stack: PDAStack<I>;

  constructor(name: string, transforms: PDATransformTable<S, I>, initialState: S, finalStates: StateSet<S>) {
    this.name = name;
    this.initialState = initialState;
    this.finalStates = finalStates;
    this.transforms = transforms;
    this.stack = [Input.$ as I];
  }

  get stateSet(): StateSet<S> {
    return new StateSet<S>([
      this.initialState,
      ...[...this.transforms.keys()].map(([state]) => state),
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
  next(input: I, record?: PDARecord<S, I>): ExtendSet<PDARecord<S, I>> {
    const currentRecord = record ?? [this.initialState, Input.$ as I];
    const transform = this.transforms.get(currentRecord);

    return transform?.get(input) ?? new ExtendSet<PDARecord<S, I>>();
  }

  push(input: I) {
    this.stack.push(input);
  }

  top(): I {
    return this.stack[this.stack.length - 1];
  }

  pop() {
    this.stack.pop();
  }

  toString() {
    const inputs = this.inputSet.vs().sort((a, b) => (a.name < b.name ? -1 : 0));
    const transformTable = new Table({
      rows: this.transforms.ks().map((record) => {
        const transform = this.transforms.get(record);
        return flattern(transform!.ks().map((input) => {
          const next = transform!.get(input);
          return next!.vs().map((result) => {
            return `[${record[0].name},${record[1].name}] + ${input.name} -> [${result[0].name},${result[1].name}]`;
          });
        }));
      }),
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
