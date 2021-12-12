/* eslint-disable max-classes-per-file */
import { Input, NondeterministicFiniteAutomachine, State } from '@/FiniteStateMachine';
import { concat, star, union } from '@/Operation';
import { ExtendMap, ExtendSet } from '@/utils';

export interface RegularExpression {
  toNFA(): NondeterministicFiniteAutomachine;
}

// a
export class LiteralExpression implements RegularExpression {
  initialState: State;

  literalInput: Input;

  finalState: State;

  stateSet: ExtendSet<State>;

  inputSet: ExtendSet<State>;

  constructor(initialState: State, literalInput: Input, finalState: State, stateSet: ExtendSet<State>, inputSet: ExtendSet<Input>) {
    this.inputSet = inputSet;
    this.stateSet = stateSet;
    this.initialState = initialState;
    this.literalInput = literalInput;
    this.finalState = finalState;
  }

  toNFA() {
    const map = new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>();

    for (const state of this.stateSet) {
      for (const input of this.inputSet) {
        if (state === this.initialState && input === this.literalInput) {
          map.set(state, new ExtendMap([[input, new ExtendSet([this.finalState])]]));
        } else {
          map.set(state, new ExtendMap([[input, new ExtendSet()]]));
        }
      }
    }

    return new NondeterministicFiniteAutomachine(
      `LiteralExpression${this.literalInput.name}`,
      map,
      this.initialState,
      new ExtendSet([this.finalState]),
    );
  }
}

// EPSILON
export class EpsilonExpression implements RegularExpression {
  initialState: State;

  stateSet: ExtendSet<State>;

  inputSet: ExtendSet<Input>;

  constructor(initialState: State, stateSet: ExtendSet<State>, inputSet: ExtendSet<Input>) {
    this.initialState = initialState;
    this.stateSet = stateSet;
    this.inputSet = inputSet;
  }

  toNFA(): NondeterministicFiniteAutomachine {
    const map = new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>();

    for (const state of this.stateSet) {
      for (const input of this.inputSet) {
        map.set(state, new ExtendMap([[input, new ExtendSet()]]));
      }
    }

    return new NondeterministicFiniteAutomachine(
      'EpsilonExpression',
      map,
      this.initialState,
      new ExtendSet([this.initialState]),
    );
  }
}

// L | R
export class UnionExpression implements RegularExpression {
  left: RegularExpression;

  right: RegularExpression;

  constructor(left: RegularExpression, right: RegularExpression) {
    this.left = left;
    this.right = right;
  }

  toNFA() {
    return union(
      this.left.toNFA(),
      this.right.toNFA(),
    );
  }
}

// LR
export class ConcatExpression implements RegularExpression {
  left: RegularExpression;

  right: RegularExpression;

  constructor(left: RegularExpression, right: RegularExpression) {
    this.left = left;
    this.right = right;
  }

  toNFA() {
    return concat(
      this.left.toNFA(),
      this.right.toNFA(),
    );
  }
}

// E*
export class StarExpression implements RegularExpression {
  exp: RegularExpression;

  constructor(exp: RegularExpression) {
    this.exp = exp;
  }

  toNFA() {
    return star(this.exp.toNFA());
  }
}
