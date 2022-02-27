/* eslint-disable max-classes-per-file */
import { ExtendSet, ExtendMap } from '@/utils';

// 状态
export class State {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

// 输入
export class Input {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  static RESET = new Input('<reset>');

  static EPSILON = new Input('<epsilon>');
}

export class DFATransform<S extends State = State, I extends Input = Input> extends ExtendMap<I, S> {}
export class DFATransformTable<S extends State = State, I extends Input = Input> extends ExtendMap<S, DFATransform<S, I>> {}
export class StateSet<S extends State = State> extends ExtendSet<S> {}
export class InputSet<I extends Input = Input> extends ExtendSet<I> {}

// 确定性有穷自动机
export class DeterministicFinitAutomachine<S extends State = State, I extends Input = Input> {
  readonly name: string;

  // 状态转换表
  readonly transforms: DFATransformTable<S, I>;

  // 初始状态
  readonly initialState: S;

  // 接受状态集
  readonly finalStates: StateSet<S>;

  constructor(name: string, transforms: DFATransformTable<S, I>, initialState: S, finalStates: StateSet<S>) {
    this.name = name;
    this.transforms = transforms;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  get stateSet(): StateSet<S> {
    return new StateSet<S>([...this.transforms.keys()].sort((a, b) => (a.name < b.name ? -1 : 0)));
  }

  get inputSet(): InputSet<I> {
    return new InputSet<I>(this.transforms.vs()
      .map((transform) => [...transform.keys()].sort((a, b) => (a.name < b.name ? -1 : 0)))
      .reduce((prev, curr) => [...curr, ...prev], []));
  }

  // 判断一个状态是否在接受状态中
  isFinal(state: S) {
    return this.finalStates.has(state);
  }

  // 根据每个状态，找到哪些状态可以到达它
  get reverseTransforms(): DFATransformTable<S, I> {
    const map = new DFATransformTable<S, I>();

    for (const state of this.stateSet) {
      const transform = new DFATransform<S, I>();

      for (const prevState of this.stateSet) {
        for (const input of this.inputSet) {
          if (this.next(input, prevState) === state) {
            transform.set(input, prevState);
          }
        }
      }

      map.set(state, transform);
    }

    return map;
  }

  // 给定一个状态和一个输入，返回下一个状态。若无法跳转返回undefined
  next(input: I, current?: S) {
    const currentState = current ?? this.initialState;

    if (input === Input.RESET) {
      return this.initialState;
    }

    const nextState = this.transforms.get(currentState)?.get(input);

    if (nextState) {
      return nextState;
    }

    if (__DEV__) {
      console.warn(`Unrecognized input for ${this.name}: ${input.name}`);
    }

    return undefined;
  }

  // 给定一个输入串执行
  run(inputs: I[], current?: S) {
    const currentState = current ?? this.initialState;
    const states = [currentState];

    for (const input of inputs) {
      const prev = states[states.length - 1];

      states.push(this.next(input, prev) ?? prev);
    }

    return states;
  }
}

export class NFATransform<S extends State = State, I extends Input = Input> extends ExtendMap<I, StateSet<S>> {}
export class NFATransformTable<S extends State = State, I extends Input = Input> extends ExtendMap<S, NFATransform<S, I>> {}

// NFA
export class NondeterministicFiniteAutomachine<S extends State = State, I extends Input = Input> {
  readonly name: string;

  readonly transforms: NFATransformTable<S, I>;

  readonly initialState: S;

  readonly finalStates: StateSet<S>;

  constructor(name: string, transforms: NFATransformTable<S, I>, initialState: S, finalStates: StateSet<S>) {
    this.name = name;
    this.transforms = transforms;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  get stateSet(): StateSet<S> {
    return new StateSet<S>([...this.transforms.keys()].sort((a, b) => (a.name < b.name ? -1 : 0)));
  }

  get inputSet(): InputSet<I> {
    return new InputSet<I>(this.transforms.vs()
      .map((transform) => [...transform.keys()].sort((a, b) => (a.name < b.name ? -1 : 0)))
      .reduce((prev, curr) => [...curr, ...prev], []));
  }

  isFinal(state:S) {
    return this.finalStates.has(state);
  }

  // 给定一个状态和一个输入，返回可到达的状态集合，若无法跳转返回空集
  next(input: I, current?: S) {
    const currentState = current ?? this.initialState;
    const nextState = this.transforms.get(currentState)?.get(input);

    return nextState ?? ExtendSet.None as StateSet<S>;
  }
}
