/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {
  NondeterministicFiniteAutomachine,
  Input,
  State,
  NFATransformTable,
  NFATransform,
  StateSet,
} from '@/FiniteStateMachine';
import { concat, star, union } from './Operation';
import { accept } from './Transform';

export interface RegularExpression {
  toNFA(): NondeterministicFiniteAutomachine;
  toString(): string;
  match(input: Input[]): boolean;
}

export class LiteralRegularExpression implements RegularExpression {
  readonly source: Input;

  private nfa?: NondeterministicFiniteAutomachine;

  constructor(source: Input) {
    this.source = source;
  }

  match(input: Input[]) {
    const nfa = this.toNFA();

    return accept(nfa, input);
  }

  toString() {
    return this.source.name;
  }

  toNFA() {
    if (!this.nfa) {
      const initialState = new State(`^${this.source.name}`);
      const finalState = new State(`${this.source.name}$`);

      this.nfa = new NondeterministicFiniteAutomachine(
        this.toString(),
        new NFATransformTable([
          [
            initialState,
            new NFATransform([
              [this.source, new StateSet([finalState])],
            ]),
          ],
        ]),
        initialState,
        new StateSet([finalState]),
      );
    }

    return this.nfa;
  }
}

export class EpsilonRegularExpression implements RegularExpression {
  nfa?: NondeterministicFiniteAutomachine;

  match(input: Input[]) {
    return accept(this.toNFA(), input);
  }

  toString() {
    return Input.EPSILON.name;
  }

  toNFA() {
    const initialState = new State(`^${Input.EPSILON.name}$`);
    if (!this.nfa) {
      this.nfa = new NondeterministicFiniteAutomachine(
        this.toString(),
        new NFATransformTable(),
        initialState,
        new StateSet([initialState]),
      );
    }

    return this.nfa;
  }
}

export class EmptyRegularExpression implements RegularExpression {
  nfa?: NondeterministicFiniteAutomachine;

  match(input: Input[]) {
    return accept(this.toNFA(), input);
  }

  toString() {
    return '∅';
  }

  toNFA() {
    if (!this.nfa) {
      const initialState = new State(`^${this.toString()}`);

      this.nfa = new NondeterministicFiniteAutomachine(
        this.toString(),
        new NFATransformTable(),
        initialState,
        new StateSet(),
      );
    }

    return this.nfa;
  }
}

export class ConcatRegularExpression implements RegularExpression {
  readonly left: RegularExpression;

  readonly right: RegularExpression;

  private nfa?: NondeterministicFiniteAutomachine;

  constructor(left: RegularExpression, right: RegularExpression) {
    this.left = left;
    this.right = right;
  }

  match(input: Input[]) {
    return accept(this.toNFA(), input);
  }

  toString() {
    return `(${this.left.toString()}${this.right.toString()})`;
  }

  toNFA() {
    if (!this.nfa) {
      const leftNFA = this.left.toNFA();
      const rightNFA = this.right.toNFA();

      this.nfa = concat(leftNFA, rightNFA);
    }

    return this.nfa;
  }
}

export class UnionRegularExpression implements RegularExpression {
  readonly left: RegularExpression;

  readonly right: RegularExpression;

  private nfa?: NondeterministicFiniteAutomachine;

  constructor(left: RegularExpression, right: RegularExpression) {
    this.left = left;
    this.right = right;
  }

  match(input: Input[]) {
    return accept(this.toNFA(), input);
  }

  toString() {
    return `(${this.left.toString()}|${this.right.toString()})`;
  }

  toNFA() {
    if (!this.nfa) {
      const leftNFA = this.left.toNFA();
      const rightNFA = this.right.toNFA();

      this.nfa = union(leftNFA, rightNFA);
    }

    return this.nfa;
  }
}

export class StarRegularExpression implements RegularExpression {
  base: RegularExpression;

  private nfa?: NondeterministicFiniteAutomachine;

  constructor(base: RegularExpression) {
    this.base = base;
  }

  match(input: Input[]) {
    return accept(this.toNFA(), input);
  }

  toString() {
    return `(${this.base.toString()}*)`;
  }

  toNFA() {
    if (!this.nfa) {
      const baseNFA = this.base.toNFA();

      this.nfa = star(baseNFA);
    }

    return this.nfa;
  }
}

export const chainRegex = (r: RegularExpression) => {
  return {
    regex: r,
    match(input: Input[]) {
      return this.regex.match(input);
    },
    stringify() {
      return this.regex.toString();
    },
    concat(rhs: RegularExpression) {
      return chainRegex(new ConcatRegularExpression(this.regex, rhs));
    },
    union(rhs: RegularExpression) {
      return chainRegex(new UnionRegularExpression(this.regex, rhs));
    },
    star() {
      return chainRegex(new StarRegularExpression(this.regex));
    },
  };
};
