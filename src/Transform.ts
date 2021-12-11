/* eslint-disable no-plusplus */
import {
  State,
  NondeterministicFiniteAutomachine,
  EPSILON,
  Input,
  DeterministicFinitAutomachine,
} from '@/FiniteStateMachine';
import { ExtendMap, ExtendSet } from '@/utils';

export class StateSet extends State {
  states: ExtendSet<State>;

  constructor(name: string, states: ExtendSet<State>) {
    super(name);

    this.states = states;
  }
}

const createStateSet = (s: ExtendSet<State>) => new StateSet(
  s.vs().map((state) => state.name).join(' '),
  s,
);

// 求一个集合的全部子集
export const getSubsets = (stateSet: ExtendSet<State>) => {
  const states = stateSet.vs();
  const set = new ExtendSet<ExtendSet<State>>([new ExtendSet()]);

  const helper = (x: number, last: ExtendSet<State>) => {
    for (let y = x; y < states.length; ++y) {
      const current = new ExtendSet([...last.vs(), states[y]]);

      set.add(current);

      helper(y + 1, current);
    }
  };

  helper(0, new ExtendSet());

  return new ExtendSet(
    set.vs()
      .sort((a, b) => (a.vs().length < b.vs().length ? -1 : 0))
      .map(createStateSet)
      .sort((a, b) => (a.name < b.name ? -1 : 0)),
  );
};

// 给定子集，在全部子集中找到相等的集合，避免new两个相同的集合
export const findStateSetInSubsets = (sets: ExtendSet<StateSet>, states: ExtendSet<State>) => {
  for (const set of sets) {
    if (ExtendSet.isSame(set.states, states)) {
      return set;
    }
  }

  if (__DEV__) {
    console.warn(`Cannot find state set in subsets:${states}`);
  }

  return createStateSet(states);
};

// 以一个状态出发经过0次或多次EPSILON得到的状态集合
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: ExtendSet<State>): ExtendSet<State>;
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: State): ExtendSet<State>;
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: State|ExtendSet<State>) {
  const nextStates = new ExtendSet<State>();

  const helper = (states: ExtendSet<State>) => {
    for (const state of states) {
      if (!nextStates.has(state)) {
        nextStates.add(state);

        helper(nfa.next(EPSILON, state));
      }
    }
  };

  if (current instanceof ExtendSet) {
    helper(current);
  } else {
    helper(new ExtendSet([current]));
  }

  return nextStates;
}

// 给定一个状态current和一个输入input，得到输出状态集合
export function getNextStates(nfa: NondeterministicFiniteAutomachine, input: Input, current: State): ExtendSet<State>;
export function getNextStates(nfa: NondeterministicFiniteAutomachine, input: Input, current: ExtendSet<State>): ExtendSet<State>;
export function getNextStates(nfa: NondeterministicFiniteAutomachine, input: Input, current: State|ExtendSet<State>) {
  const nextStates = new ExtendSet<State>();

  if (current instanceof ExtendSet) {
    for (const state of current) {
      nextStates.addMultiple(nfa.next(input, state));
    }
  } else {
    nextStates.addMultiple(nfa.next(input, current));
  }

  for (const state of nextStates) {
    nextStates.addMultiple(getEpsilonNextStates(nfa, state));
  }

  return nextStates;
}

export const NFA2DFA = (nfa: NondeterministicFiniteAutomachine) => {
  const subsets = getSubsets(nfa.avaliableStates);
  // DFA的起始状态为NFA的起始状态加上该状态经过EPSILON到达的状态集合
  const initialState = findStateSetInSubsets(subsets, getEpsilonNextStates(nfa, nfa.initialState));
  // DFA的终止状态为subsets中所有包含NFA的接受状态的状态
  const finalStates = new ExtendSet(subsets.vs().filter((s) => {
    for (const finalState of nfa.finalStates) {
      if (s.states.has(finalState)) {
        return true;
      }
    }
    return false;
  }));

  // 计算DFA的状态转移函数
  const map = new ExtendMap<StateSet, ExtendMap<Input, StateSet>>();

  // 对于DFA中的每个状态subState，其集合中每个state经过input所能到达的state集合构成新的subState
  for (const subState of subsets) {
    const transform = new ExtendMap<Input, StateSet>();

    for (const input of nfa.avaliableInputs) {
      if (input === EPSILON) continue;

      const nestStates = getNextStates(nfa, input, subState);
      const nextState = findStateSetInSubsets(subsets, nestStates);

      transform.set(input, nextState);
    }

    map.set(subState, transform);
  }

  return new DeterministicFinitAutomachine(
    nfa.name,
    map,
    initialState,
    finalStates,
  );
};
