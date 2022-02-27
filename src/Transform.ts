/* eslint-disable no-plusplus */
import {
  State,
  Input,
  StateSet,
  DFATransform,
  NFATransform,
  NFATransformTable,
  DeterministicFinitAutomachine,
  NondeterministicFiniteAutomachine,
  DFATransformTable,
} from '@/FiniteStateMachine';

// NFA转DFA时，会将若干个状态合并为一个新的状态
export class MergedState extends State {
  states: StateSet;

  constructor(name: string, states: StateSet) {
    super(name);

    this.states = states;
  }
}

export const createStateSet = (s: StateSet) => new MergedState(
  s.vs().map((state) => state.name).join(' '),
  s,
);

// 求一个集合的全部子集
export const getSubsets = (stateSet: StateSet) => {
  return new StateSet(
    stateSet.subsets().vs().map(createStateSet).sort((a, b) => (a.name < b.name ? -1 : 0)),
  );
};

// 给定子集，在全部子集中找到相等的集合，避免new两个相同的集合进行相等比较，由于引用不同返回不相等
export const findStateInSubstates = (sets: StateSet<MergedState>, states: StateSet) => {
  for (const set of sets) {
    if (StateSet.isSame(set.states, states)) {
      return set;
    }
  }

  console.log(sets, states);

  throw new Error('Cannot find state set in subsets');
};

/**
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @param {StateSet} current - 当前状态
 * @returns {StateSet} 经过EPSILON可到达的下一个状态集
 */
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: StateSet): StateSet;
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: State): StateSet;
export function getEpsilonNextStates(nfa: NondeterministicFiniteAutomachine, current: State|StateSet) {
  const nextStates = new StateSet();

  const helper = (states: StateSet) => {
    for (const state of states) {
      if (!nextStates.has(state)) {
        nextStates.add(state);

        helper(nfa.next(Input.EPSILON, state));
      }
    }
  };

  if (current instanceof StateSet) {
    helper(current);
  } else {
    helper(new StateSet([current]));
  }

  return nextStates;
}

/**
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @param {Input} input - 输入
 * @param {State} state - 当前状态
 * @returns {StateSet} 下一个状态集合
 */
export function getNextStates(nfa: NondeterministicFiniteAutomachine, input: Input, current: State): StateSet;
export function getNextStates(nfa: NondeterministicFiniteAutomachine, input: Input, current: StateSet): StateSet;
export function getNextStates(nfa: NondeterministicFiniteAutomachine, input: Input, current: State|StateSet) {
  const nextStates = new StateSet();

  if (current instanceof StateSet) {
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

const computeReachableStates = (nfa: NondeterministicFiniteAutomachine, state: State): NFATransform => {
  const reachableStates = new NFATransform();

  for (const input of nfa.inputSet) {
    if (input === Input.EPSILON) {
      continue;
    }
    reachableStates.set(input, getNextStates(nfa, input, state));
  }

  return reachableStates;
};

/**
 * 将NFA转换为等价的DFA
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @returns {DeterministicFinitAutomachine} DFA
 */
export const NFA2DFA = (nfa: NondeterministicFiniteAutomachine): DeterministicFinitAutomachine<MergedState> => {
  const subsets = getSubsets(nfa.stateSet);
  // 存放NFA中每个小状态经过非EPSILON到达的状态集合，这些集合将合并为一个DFA中的大状态
  const table = new NFATransformTable();

  for (const state of nfa.stateSet) {
    table.set(state, computeReachableStates(nfa, state));
  }

  // 用于记录每个状态是否已经被访问过
  const memory = new StateSet<MergedState>();
  // 计算DFA的状态转移函数
  const map = new DFATransformTable<MergedState>();

  // 针对MergedState中的每个小状态，求出可到达的下一个NFA小状态，合并为DFA的一个状态，直到没有新的DFA状态出现
  const helper = (current: MergedState) => {
    if (!memory.has(current)) {
      memory.add(current);

      const transform = new DFATransform<MergedState>();

      for (const input of nfa.inputSet) {
        if (input === Input.EPSILON) {
          continue;
        }
        // NFA的小状态到达的状态合并之后是DFA的某个状态
        const nextStates = current.states.vs()
          .map((each) => table.get(each)?.get(input) ?? new StateSet())
          .reduce((p, c) => { return StateSet.union(p, c); });

        if (nextStates.length > 0) {
          const nextStateSet = findStateInSubstates(subsets, nextStates);

          transform.set(input, nextStateSet);
          helper(nextStateSet);
        }
      }

      map.set(current, transform);
    }
  };

  // DFA的起始状态为NFA的起始状态加上该状态经过EPSILON到达的状态集合
  const initialState = findStateInSubstates(subsets, getEpsilonNextStates(nfa, nfa.initialState));

  helper(initialState);

  // DFA的终止状态需包含NFA的至少一个接受状态
  const finalStates = new StateSet(memory.vs().filter((state) => {
    for (const finalState of nfa.finalStates) {
      if (state.states.has(finalState)) {
        return true;
      }
    }
    return false;
  }));

  return new DeterministicFinitAutomachine(nfa.name, map, initialState, finalStates);
};

// 给定一个输入串，返回是否可以达到接受状态
export const accept = (machine: DeterministicFinitAutomachine|NondeterministicFiniteAutomachine, inputs: Input[]): boolean => {
  if (machine instanceof DeterministicFinitAutomachine) {
    let currentState: State|undefined = machine.initialState;

    for (const input of inputs) {
      currentState = machine.next(input, currentState);

      if (!currentState) {
        return false;
      }
    }

    return machine.isFinal(currentState);
  }

  const dfa = NFA2DFA(machine);

  return accept(dfa, inputs);
};
