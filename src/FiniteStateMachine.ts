/* eslint-disable max-classes-per-file */
import '@/utils';

export class State {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  toString() {
    return `State(${this.name})`;
  }
}

export class Input {
  letter: string;

  constructor(letter: string) {
    this.letter = letter;
  }

  toString() {
    return `Input(${this.letter})`;
  }
}

export const RESET = new Input('<RESET>');
export const EPSILON = new Input('<EPSILON>');

// 确定性有穷自动机
export class DeterministicFinitAutomachine {
  readonly name: string;

  readonly transforms: Map<State, Map<Input, State>>;

  readonly initialState: State;

  readonly finalStates: Set<State>;

  constructor(name: string, transforms: Map<State, Map<Input, State>>, initialState: State, finalStates: Set<State>) {
    this.name = name;
    this.transforms = transforms;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  get avaliableStates() {
    return new Set(this.transforms.keys());
  }

  get avaliableInputs() {
    return new Set(this.transforms.vals()
      .map((transform) => [...transform.keys()])
      .reduce((prev, curr) => [...curr, ...prev], [])
      .uniq());
  }

  isFinal(state: State) {
    return this.finalStates.has(state);
  }

  // 给定一个状态，跳转下一个状态
  next(input: Input, current?: State) {
    const currentState = current ?? this.initialState;

    if (input === RESET) {
      return this.initialState;
    }
    const nextState = this.transforms.get(currentState)?.get(input);

    if (nextState) {
      return nextState;
    }

    if (__DEV__) {
      console.warn(`Unrecognized input for ${this.name}: ${input.letter}`);
    }

    return currentState;
  }

  // 给定一个输入串执行
  run(inputs: Input[], current?: State) {
    const currentState = current ?? this.initialState;
    const states = [currentState];

    for (const input of inputs) {
      states.push(this.next(input, states[states.length - 1]));
    }

    return states;
  }
}

// NFA
export class NondeterministicFiniteAutomachine {
  readonly name: string;

  private readonly transforms: Map<State, Map<Input, Set<State>>>;

  readonly initialState: State;

  readonly finalStates: Set<State>;

  constructor(name: string, transforms: Map<State, Map<Input, Set<State>>>, initialState: State, finalStates: Set<State>) {
    this.name = name;
    this.transforms = transforms;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  get avaliableStates() {
    return new Set(this.transforms.keys());
  }

  get avaliableInputs() {
    return new Set(this.transforms.vals()
      .map((transform) => [...transform.keys()])
      .reduce((prev, curr) => [...curr, ...prev], [])
      .uniq());
  }

  isFinal(state:State) {
    return this.finalStates.has(state);
  }

  // 给定一个状态，跳转下一个状态
  next(input: Input, current?: State) {
    const currentState = current ?? this.initialState;
    const nextState = this.transforms.get(currentState)?.get(input);

    return nextState ?? new Set<State>();
  }
}
