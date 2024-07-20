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
export class MergedState<S extends State = State> extends State {
  states: StateSet<S>;

  constructor(name: string, states: StateSet<S>) {
    super(name);

    this.states = states;
  }
}

// 求一个集合的全部子集
// export const getSubsets = (stateSet: StateSet) => {
//   return new StateSet(
//     stateSet
//       .subsets()
//       .vs()
//       .map((s) => new MergedState(
//         s.vs().map((state) => state.name).join(' '),
//         s,
//       ))
//       .sort((a, b) => (a.name < b.name ? -1 : 0)),
//   );
// };

// 给定子集，在全部子集中找到相等的集合，避免new两个相同的集合进行相等比较
// 早先的实现时在全集里面找，但是求全部子集时若元素较多会栈溢出
export const findStateInSubstates = <S extends State = State>(
  sets: StateSet<MergedState<S>>,
  states: StateSet<S>,
) => {
  for (const set of sets) {
    if (StateSet.isSame(set.states, states)) {
      return set;
    }
  }

  // 如果没有就新增
  const newSubState = new MergedState<S>(
    states
      .vs()
      .map(s => s.name)
      .join(' '),
    states,
  );

  sets.add(newSubState);

  return newSubState;
};

/**
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @param {StateSet} current - 当前状态
 * @returns {StateSet} 经过EPSILON可到达的下一个状态集
 */
export function getEpsilonNextStates<
  S extends State = State,
  I extends Input = Input,
>(nfa: NondeterministicFiniteAutomachine<S, I>, current: S): StateSet<S> {
  const nextStates = new StateSet<S>();

  const helper = (states: StateSet<S>) => {
    for (const state of states) {
      if (!nextStates.has(state)) {
        nextStates.add(state);

        helper(nfa.next(Input.EPSILON as I, state));
      }
    }
  };

  helper(new StateSet([current]));

  return nextStates;
}

/**
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @param {Input} input - 输入
 * @param {State} state - 当前状态
 * @returns {StateSet} 下一个状态集合
 */
export function getNextStates<S extends State = State, I extends Input = Input>(
  nfa: NondeterministicFiniteAutomachine<S, I>,
  input: I,
  current: S,
): StateSet<S> {
  const nextStates = new StateSet<S>();

  nextStates.addMultiple(nfa.next(input, current));

  for (const state of nextStates) {
    nextStates.addMultiple(getEpsilonNextStates(nfa, state));
  }

  return nextStates;
}

const computeReachableStates = <
  S extends State = State,
  I extends Input = Input,
>(
  nfa: NondeterministicFiniteAutomachine<S, I>,
  state: S,
): NFATransform<S, I> => {
  const reachableStates = new NFATransform<S, I>();

  for (const input of nfa.inputSet) {
    if (input === Input.EPSILON) continue;

    reachableStates.set(input, getNextStates(nfa, input, state));
  }

  return reachableStates;
};

/**
 * 将NFA转换为等价的DFA
 * @param {NondeterministicFiniteAutomachine} nfa - NFA
 * @returns {DeterministicFinitAutomachine} DFA
 */
export const NFA2DFA = <S extends State = State, I extends Input = Input>(
  nfa: NondeterministicFiniteAutomachine<S, I>,
): DeterministicFinitAutomachine<MergedState<S>, I> => {
  const subsets = new StateSet<MergedState<S>>();
  // 存放NFA中每个小状态针对每个输入（除EPSILON）可到达的状态集合，方便取用
  // 每个集合将成为为一个DFA中的大状态
  const table = new NFATransformTable<S, I>();

  for (const state of nfa.stateSet) {
    table.set(state, computeReachableStates(nfa, state));
  }

  // 用于记录每个状态是否已经被访问过
  const memory = new StateSet<MergedState<S>>();
  // 计算DFA的状态转移函数
  const map = new DFATransformTable<MergedState<S>, I>();

  // 针对MergedState中的每个小状态，求出可到达的下一个NFA小状态，合并为DFA的一个状态，直到没有新的DFA状态出现
  const helper = (current: MergedState<S>) => {
    if (!memory.has(current)) {
      memory.add(current);

      const transform = new DFATransform<MergedState<S>, I>();

      for (const input of nfa.inputSet) {
        if (input === Input.EPSILON) continue;

        // NFA的小状态到达的状态合并之后是DFA的某个状态
        const nextStates = current.states
          .vs()
          .map(each => table.get(each)?.get(input) ?? new StateSet<S>())
          .reduce((p, c) => {
            return StateSet.union(p, c);
          });

        if (nextStates.length > 0) {
          const nextStateSet = findStateInSubstates<S>(subsets, nextStates);

          transform.set(input, nextStateSet);
          helper(nextStateSet);
        }
      }

      map.set(current, transform);
    }
  };

  // DFA的起始状态为NFA的起始状态加上该状态经过EPSILON到达的状态集合
  const initialState = findStateInSubstates(
    subsets,
    getEpsilonNextStates(nfa, nfa.initialState),
  );

  helper(initialState);

  // DFA的终止状态需包含NFA的至少一个接受状态
  const finalStates = new StateSet(
    memory.vs().filter(state => {
      for (const finalState of nfa.finalStates) {
        if (state.states.has(finalState)) {
          return true;
        }
      }
      return false;
    }),
  );

  return new DeterministicFinitAutomachine(
    nfa.name,
    map,
    initialState,
    finalStates,
  );
};

// 给定一个输入串，是否可以到达接受状态
export const accept = <S extends State = State, I extends Input = Input>(
  machine:
    | DeterministicFinitAutomachine<S, I>
    | NondeterministicFiniteAutomachine<S, I>,
  inputs: I[],
): boolean => {
  if (machine instanceof DeterministicFinitAutomachine) {
    let currentState: S | undefined = machine.initialState;

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

export const run = <S extends State = State, I extends Input = Input>(
  machine: DeterministicFinitAutomachine<S, I>,
  inputs: I[],
): S[] => {
  const states = [machine.initialState];

  for (const input of inputs) {
    const last = states[states.length - 1];
    states.push(machine.next(input, last) ?? last);
  }

  return states;
};
