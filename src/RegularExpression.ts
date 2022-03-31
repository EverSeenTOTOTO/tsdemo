/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import {
  Input,
  State,
  StateSet,
  NFATransform,
  NFATransformTable,
  DeterministicFinitAutomachine,
  NondeterministicFiniteAutomachine,
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
    return Input.EMPTY.name;
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

// GNFA的输入是任意正则表达式
export class GNFAInput extends Input {
  regex: RegularExpression;

  constructor(regex: RegularExpression) {
    super(regex.toString());
    this.regex = regex;
  }
}

// 将DFA转为GNFA
export const DFA2GNFA = (dfa: DeterministicFinitAutomachine) => {
  // 新的起始状态
  const initialState = new State(`^${dfa.name}`);
  // 新的终止状态
  const finalState = new State(`${dfa.name}$`);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const transformTable = new NFATransformTable<State, GNFAInput>([
    [
      initialState,
      new NFATransform<State, GNFAInput>([
        [
          new GNFAInput(new EpsilonRegularExpression()),
          new StateSet([dfa.initialState]),
        ],
      ]),
    ],
    ...dfa.finalStates.vs().map((state) => {
      return [
        state,
        new NFATransform([
          [
            new GNFAInput(new EpsilonRegularExpression()),
            new StateSet([finalState]),
          ],
        ]),
      ];
    }) as [State, NFATransform<State, GNFAInput>][],
  ]);

  // 如果两个状态之间有多个同向箭头，那么使用其并集代替
  for (const q1 of dfa.stateSet.vs()) {
    for (const q2 of dfa.stateSet.vs()) {
      const inputs: RegularExpression[] = [];

      for (const input of dfa.inputSet) {
        if (dfa.next(input, q1) === q2) {
          inputs.push(input === Input.EPSILON ? new EpsilonRegularExpression() : new LiteralRegularExpression(input));
        }
      }

      if (inputs.length > 0) {
        const chained = inputs.reduce((prev, curr) => {
          return new UnionRegularExpression(prev, curr);
        });

        const transform = transformTable.get(q1) ?? new NFATransform();

        transform.set(new GNFAInput(chained), new StateSet([q2]));
        transformTable.set(q1, transform);
      }
    }
  }

  return new NondeterministicFiniteAutomachine<State, GNFAInput>(
    dfa.name,
    transformTable,
    initialState,
    new StateSet([finalState]),
  );
};

export const DFA2Regex = (dfa: DeterministicFinitAutomachine) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const gnfa = DFA2GNFA(dfa);
  // debugger;

  const findRegex = (qa: State, qb: State) => {
    const transform = gnfa.transforms.get(qa);

    return transform?.ks().find((i) => transform.get(i)?.has(qb))?.regex;
  };

  // q1->qx R1
  // qx->q2 R2
  // qx->qx R3
  // q1->q2 R4
  // remove qx, q1->q2: (R1 R3* R2)|R4
  // repeat until gnfa has only two states: the initialState and the finalState
  const states = gnfa.stateSet;
  while (states.length > 2) {
    for (const qx of states) {
      // 选择一个所有不是起始和结束状态的状态qx
      if (qx === gnfa.initialState || gnfa.isFinal(qx)) continue;
      for (const q1 of states) { // 任选一个不是结束状态和qx的q1，GNFA的结束状态无转换
        if (q1 === qx || gnfa.isFinal(q1)) continue;
        for (const q2 of states) { // 任选一个不是q1和qx的q2
          if (q2 === qx || q2 === q1) continue;
          const R1 = findRegex(q1, qx);
          const R2 = findRegex(qx, q2);

          if (R1 && R2) {
            const R3 = findRegex(qx, qx);
            const R4 = findRegex(q1, q2);
            let R: RegularExpression = R3
              ? new ConcatRegularExpression(new ConcatRegularExpression(R1, new StarRegularExpression(R3)), R2)
              : new ConcatRegularExpression(R1, R2);
            R = R4 ? new UnionRegularExpression(R, R4) : R;

            if (R) {
              const transform = gnfa.transforms.get(q1) ?? new NFATransform();

              transform.set(new GNFAInput(R), new StateSet([q2]));
              gnfa.transforms.set(q1, transform);
            }
          }
        }
      }
      // 移除qx
      states.delete(qx);
      gnfa.transforms.delete(qx);
      for (const state of states) {
        const transform = gnfa.transforms.get(state);
        if (transform) {
          for (const input of transform.ks()) {
            const set = transform.get(input);
            set?.delete(qx);
            if (set && set.length > 0) {
              transform.set(input, set);
            } else {
              transform.delete(input);
            }
          }
        }
      }
      break;
    }
  }

  // only one transform left
  return gnfa.transforms.get(gnfa.initialState)?.ks()[0].regex;
};
