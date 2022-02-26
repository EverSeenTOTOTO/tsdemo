/* eslint-disable no-plusplus */
import {
  State,
  NondeterministicFiniteAutomachine,
  Input,
  DeterministicFinitAutomachine,
} from '@/FiniteStateMachine';
import { ExtendMap, ExtendSet } from '@/utils';

// NFA转DFA时，会将若干个状态合并为一个新的状态
export class MergedState extends State {
  states: ExtendSet<State>;

  constructor(name: string, states: ExtendSet<State>) {
    super(name);

    this.states = states;
  }
}

export const createStateSet = (s: ExtendSet<State>) => new MergedState(
  s.vs().map((state) => state.name).join(' '),
  s,
);

// 求一个集合的全部子集
export const getSubsets = (stateSet: ExtendSet<State>) => {
  return new ExtendSet(
    stateSet.subsets().vs().map(createStateSet).sort((a, b) => (a.name < b.name ? -1 : 0)),
  );
};

// 给定子集，在全部子集中找到相等的集合，避免new两个相同的集合进行相等比较，由于引用不同返回不等
export const findStateSetInSubsets = (sets: ExtendSet<MergedState>, states: ExtendSet<State>) => {
  for (const set of sets) {
    if (ExtendSet.isSame(set.states, states)) {
      return set;
    }
  }

  if (__DEV__) {
    console.warn(`Cannot find state set in subsets: ${JSON.stringify(states.vs())}`);
  }

  return createStateSet(states);
};

/**
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @param {ExtendSet<State>} current - 当前状态
 * @returns {ExtendSet<State>} 经过EPSILON可到达的下一个状态集
 */
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: ExtendSet<State>): ExtendSet<State>;
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: State): ExtendSet<State>;
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: State|ExtendSet<State>) {
  const nextStates = new ExtendSet<State>();

  const helper = (states: ExtendSet<State>) => {
    for (const state of states) {
      if (!nextStates.has(state)) {
        nextStates.add(state);

        helper(nfa.next(Input.EPSILON, state));
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

/**
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @param {Input} input - 输入
 * @param {State} state - 当前状态
 * @returns {ExtendSet<State>} 下一个状态集合
 */
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

/**
 * 将NFA转换为等价的DFA
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @returns {DeterministicFinitAutomachine} DFA
 */
export const NFA2DFA = (nfa: NondeterministicFiniteAutomachine): DeterministicFinitAutomachine<MergedState> => {
  const subsets = getSubsets(nfa.stateSet);
  // DFA的起始状态为NFA的起始状态加上该状态经过EPSILON到达的状态集合
  const initialState = findStateSetInSubsets(subsets, getEpsilonNextStates(nfa, nfa.initialState));
  // DFA的终止状态为subsets中所有包含NFA的至少一个接受状态的状态
  const finalStates = new ExtendSet(subsets.vs().filter((s) => {
    for (const finalState of nfa.finalStates) {
      if (s.states.has(finalState)) {
        return true;
      }
    }
    return false;
  }));

  // 计算DFA的状态转移函数
  const map = new ExtendMap<MergedState, ExtendMap<Input, MergedState>>();

  // 对于DFA中的每个状态subState，其集合中每个state经过input所能到达的state集合构成新的subState，也就是下一个状态
  for (const subState of subsets) {
    const transform = new ExtendMap<Input, MergedState>();

    for (const input of nfa.inputSet) {
      if (input === Input.EPSILON) continue;

      const nextStates = getNextStates(nfa, input, subState.states);
      const nextState = findStateSetInSubsets(subsets, nextStates);

      transform.set(input, nextState);
    }

    map.set(subState, transform);
  }

  const dfa = new DeterministicFinitAutomachine(
    nfa.name,
    map,
    initialState,
    finalStates,
  );

  // 移除无法到达的状态
  for (const [state, transform] of dfa.reverseTransform) {
    if (transform.length === 0 && dfa.initialState !== state) {
      dfa.transforms.delete(state);

      if (__DEV__) {
        console.info(`Removed unreachable state ${state.name}`);
      }
    }
  }

  return dfa;
};
