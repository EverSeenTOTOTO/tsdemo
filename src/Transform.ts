/* eslint-disable no-plusplus */
import {
  State,
  NondeterministicFiniteAutomachine,
  EPSILON,
  Input,
  DeterministicFinitAutomachine,
} from '@/FiniteStateMachine';

export class SubState extends State {
  states: Set<State>;

  constructor(name: string, states: Set<State>) {
    super(name);

    this.states = states;
  }

  toString() {
    return `SubState(${this.name})`;
  }
}

export const createSubState = (s: Set<State>) => new SubState(
  s.vals().map((state) => state.name).join(' '),
  s,
);

// 求一个集合的全部子集
export const getSubset = <T extends State>(stateSet: Set<T>) => {
  const states = stateSet.vals();
  const set = new Set<Set<State>>([new Set()]);

  const helper = (x: number, last: Set<State>) => {
    for (let y = x; y < states.length; ++y) {
      const current = new Set([...last.vals(), states[y]]);

      set.add(current);

      helper(y + 1, current);
    }
  };

  helper(0, new Set());

  return new Set(
    set.vals()
      .sort((a, b) => (a.vals().length < b.vals().length ? -1 : 0))
      .map(createSubState)
      .sort((a, b) => (a.name < b.name ? -1 : 0)),
  );
};

// 给定数组，在子集中找到相等的集合，避免new两个相同的集合
export const getSubsetState = (sets: Set<SubState>, states: State[]) => {
  for (const set of sets) {
    let ok = true;

    for (const s of set.states) {
      if (states.indexOf(s) === -1) {
        ok = false;
        break;
      }
    }

    for (const s of states) {
      if (!set.states.has(s)) {
        ok = false;
        break;
      }
    }

    if (ok) {
      return set;
    }
  }

  throw new Error('Cannot find subset state');
};

// 给定一个状态current和一个输入input，得到输出状态集合
export const getNextStates = (nfa: NondeterministicFiniteAutomachine, input: Input, current: State) => {
  const nextStates = new Set<State>();

  const helper = (states: Set<State>) => {
    for (const state of states) {
      if (!nextStates.has(state)) {
        nextStates.add(state);

        helper(nfa.next(EPSILON, state));
      }
    }
  };

  helper(nfa.next(input, current));

  return nextStates;
};

export const NFA2DFA = (nfa: NondeterministicFiniteAutomachine) => {
  const subsets = getSubset(nfa.avaliableStates);
  // DFA的起始状态为NFA的起始状态加上该状态经过EPSILON到达的状态集合
  const initialState = getSubsetState(subsets, [
    nfa.initialState,
    ...getNextStates(nfa, EPSILON, nfa.initialState).vals(),
  ]);
  // DFA的终止状态为subsets中所有包含NFA的接受状态的状态
  const finalStates = new Set(subsets.vals().filter((s) => {
    for (const finalState of nfa.finalStates) {
      if (s.states.has(finalState)) {
        return true;
      }
    }
    return false;
  }));

  // 计算DFA的状态转移函数
  const map = new Map<SubState, Map<Input, SubState>>();

  // 对于DFA中的每个状态subState，其集合中每个state经过input所能到达的state集合构成新的subState
  for (const subState of subsets) {
    const transform = new Map<Input, SubState>();

    for (const input of nfa.avaliableInputs) {
      const nestStates = new Set<State>();

      for (const state of subState.states) {
        nestStates.addMultiple(...getNextStates(nfa, input, state));
      }
      const nextState = getSubsetState(subsets, nestStates.vals());

      transform.set(input, nextState);
    }

    map.set(subState, transform);
  }

  return new DeterministicFinitAutomachine(
    `~${nfa.name}`,
    map,
    initialState,
    finalStates,
  );
};
