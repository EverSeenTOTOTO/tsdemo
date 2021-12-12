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
export class DeterministicFinitAutomachine<S extends State = State, I extends Input = Input> {
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

  // 根据每个状态，找到哪些状态可以到达它
  get reverseTransform() {
    const map = new ExtendMap<S, ExtendMap<I, S>>();

    for (const state of this.avaliableStates) {
      const prevStates = new ExtendMap<I, S>();

      for (const prevState of this.avaliableStates) {
        for (const input of this.avaliableInputs) {
          if (this.next(input, prevState) === state) {
            prevStates.set(input, prevState);
          }
        }
      }

      map.set(state, prevStates);
    }

    return map;
  }

  isFinal(state: S) {
    return this.finalStates.has(state);
  }

  // 给定一个状态和一个输入，返回下一个状态。若无法跳转返回undefined
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

    return undefined;
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
export class NondeterministicFiniteAutomachine<S extends State = State, I extends Input = Input> {
  readonly name: string;

  readonly transforms: ExtendMap<S, ExtendMap<I, ExtendSet<S>>>;

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

  // 给定一个状态和一个输入，返回可到达的状态集合，若无法跳转返回空
  next(input: I, current?: S) {
    const currentState = current ?? this.initialState;
    const nextState = this.transforms.get(currentState)?.get(input);

    return nextState ?? new ExtendSet<S>();
  }
}
