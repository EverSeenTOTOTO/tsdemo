import {
  EPSILON,
  Input,
  NondeterministicFiniteAutomachine, State,
} from '@/FiniteStateMachine';
import { ExtendMap, ExtendSet } from '@/utils';

// 并运算
export const union = (a: NondeterministicFiniteAutomachine, b: NondeterministicFiniteAutomachine) => {
  // 新的起始状态
  const initialState = new State(`${a.initialState.name} U ${b.initialState.name}`);
  // 新的接受状态是a和b的接受状态并集
  const finalStates = ExtendSet.union(a.finalStates, b.finalStates);

  const avaliableInputs = ExtendSet.union(a.avaliableInputs, b.avaliableInputs);

  // 新的起始状态经过EPSILON到达a和b
  avaliableInputs.add(EPSILON);

  const avaliableStates = ExtendSet.union(a.avaliableStates, b.avaliableStates);

  avaliableStates.add(initialState);

  // 计算新的转换函数
  const map = new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>();
  for (const state of avaliableStates) {
    const transform = new ExtendMap<Input, ExtendSet<State>>();

    for (const input of avaliableInputs) {
      if (state === initialState) { // 如果是新的起始状态，经过EPSILON到达a和b的起始状态
        if (input === EPSILON) {
          transform.set(input, new ExtendSet([a.initialState, b.initialState]));
        } else {
          transform.set(input, new ExtendSet());
        }
      } else {
        const nextA = a.next(input, state);
        const nextB = b.next(input, state);

        transform.set(input, ExtendSet.union(nextA, nextB));
      }
    }

    map.set(state, transform);
  }

  return new NondeterministicFiniteAutomachine(
    `${a.name} U ${b.name}`,
    map,
    initialState,
    finalStates,
  );
};

// 连接运算
export const concat = (a: NondeterministicFiniteAutomachine, b: NondeterministicFiniteAutomachine) => {
  const avaliableInputs = ExtendSet.union(a.avaliableInputs, b.avaliableInputs);

  // 新的起始状态经过EPSILON到达a和b
  avaliableInputs.add(EPSILON);

  const avaliableStates = ExtendSet.union(a.avaliableStates, b.avaliableStates);

  // 计算新的转换函数
  const map = new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>();

  for (const state of avaliableStates) {
    const transform = new ExtendMap<Input, ExtendSet<State>>();

    for (const input of avaliableInputs) {
      const nextStates = ExtendSet.union(a.next(input, state), b.next(input, state));

      if (a.finalStates.has(state) && input === EPSILON) {
        // 针对a的每一个接受状态，增加一个EPSILON到q2的起始状态
        nextStates.add(b.initialState);
      }

      transform.set(input, nextStates);
    }

    map.set(state, transform);
  }

  return new NondeterministicFiniteAutomachine(
    `${a.name} & ${b.name}`,
    map,
    a.initialState,
    b.finalStates,
  );
};

// 星号运算
export const star = (nfa: NondeterministicFiniteAutomachine) => {
  // 新的起始状态
  const initialState = new State(`${nfa.initialState}*`);

  const avaliableInputs = new ExtendSet(nfa.avaliableInputs);

  // 新的起始状态经过EPSILON到达原有的起始状态
  avaliableInputs.add(EPSILON);

  const avaliableStates = new ExtendSet(nfa.avaliableStates);

  avaliableStates.add(initialState);

  // 计算新的转换函数
  const map = new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>();

  for (const state of avaliableStates) {
    const transform = new ExtendMap<Input, ExtendSet<State>>();

    for (const input of avaliableInputs) {
      if (state === initialState) {
        if (input === EPSILON) { // 新的起始状态经过EPSILON到达旧的起始状态
          transform.set(input, new ExtendSet([nfa.initialState]));
        } else {
          transform.set(input, new ExtendSet());
        }
      } else if (nfa.finalStates.has(state) && input === EPSILON) { // 给旧的接受状态增加经过EPSILON到达旧的起始状态的转换
        const nextStates = nfa.next(input, state);

        nextStates.add(nfa.initialState);
        transform.set(input, nextStates);
      } else {
        transform.set(input, nfa.next(input, state));
      }
    }

    map.set(state, transform);
  }

  return new NondeterministicFiniteAutomachine(
    `${nfa.name}*`,
    map,
    initialState,
    nfa.finalStates,
  );
};
