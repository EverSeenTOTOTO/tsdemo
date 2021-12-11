/* eslint-disable max-classes-per-file */
import { ExtendSet, ExtendMap } from '@/utils';

export class State {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export class Input {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export const RESET = new Input('<RESET>');
export const EPSILON = new Input('<EPSILON>');

// 确定性有穷自动机
export class DeterministicFinitAutomachine<S extends State, I extends Input> {
  readonly name: string;

  readonly transforms: ExtendMap<S, ExtendMap<I, S>>;

  readonly initialState: S;

  readonly finalStates: ExtendSet<S>;

  constructor(name: string, transforms: ExtendMap<S, ExtendMap<I, S>>, initialState: S, finalStates: ExtendSet<S>) {
    this.name = name;
    this.transforms = transforms;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  get avaliableStates() {
    return new ExtendSet(this.transforms.keys());
  }

  get avaliableInputs() {
    return new ExtendSet(this.transforms.vs()
      .map((transform) => [...transform.keys()])
      .reduce((prev, curr) => [...curr, ...prev], []));
  }

  isFinal(state: S) {
    return this.finalStates.has(state);
  }

  // 给定一个状态，跳转下一个状态
  next(input: I, current?: S) {
    const currentState = current ?? this.initialState;

    if (input === RESET) {
      return this.initialState;
    }

    const nextState = this.transforms.get(currentState)?.get(input);

    if (nextState) {
      return nextState;
    }

    if (__DEV__) {
      console.warn(`Unrecognized input for ${this.name}: ${input.name}`);
    }

    return currentState;
  }

  // 给定一个输入串执行
  run(inputs: I[], current?: S) {
    const currentState = current ?? this.initialState;
    const states = [currentState];

    for (const input of inputs) {
      states.push(this.next(input, states[states.length - 1]));
    }

    return states;
  }
}

// NFA
export class NondeterministicFiniteAutomachine<S extends State, I extends Input> {
  readonly name: string;

  private readonly transforms: ExtendMap<S, ExtendMap<I, ExtendSet<S>>>;

  readonly initialState: S;

  readonly finalStates: ExtendSet<S>;

  constructor(name: string, transforms: ExtendMap<S, ExtendMap<I, ExtendSet<S>>>, initialState: S, finalStates: ExtendSet<S>) {
    this.name = name;
    this.transforms = transforms;
    this.initialState = initialState;
    this.finalStates = finalStates;
  }

  get avaliableStates() {
    return new ExtendSet(this.transforms.keys());
  }

  get avaliableInputs() {
    return new ExtendSet(this.transforms.vs()
      .map((transform) => [...transform.keys()])
      .reduce((prev, curr) => [...curr, ...prev], []));
  }

  isFinal(state:S) {
    return this.finalStates.has(state);
  }

  // 给定一个状态，跳转下一个状态
  next(input: I, current?: S) {
    const currentState = current ?? this.initialState;
    const nextState = this.transforms.get(currentState)?.get(input);

    return nextState ?? new ExtendSet<S>();
  }
}
