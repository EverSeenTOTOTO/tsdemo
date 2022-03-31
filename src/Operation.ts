import {
  Input,
  State,
  StateSet,
  NFATransform,
  NondeterministicFiniteAutomachine,
  NFATransformTable,
} from '@/FiniteStateMachine';

// 并运算
export const union = (a: NondeterministicFiniteAutomachine, b: NondeterministicFiniteAutomachine) => {
  // 新的起始状态
  const initialState = new State(`^${a.initialState.name}|${b.initialState.name}`);
  // 新的接受状态是a和b的接受状态并集
  const finalStates = StateSet.union(a.finalStates, b.finalStates);

  const inputSet = StateSet.union(a.inputSet, b.inputSet);

  // 新的起始状态经过EPSILON到达a和b
  inputSet.add(Input.EPSILON);

  const stateSet = StateSet.union(a.stateSet, b.stateSet);

  stateSet.add(initialState);

  // 计算新的转换函数
  const map = new NFATransformTable();
  for (const state of stateSet) {
    const transform = new NFATransform();

    for (const input of inputSet) {
      if (state === initialState) { // 如果是新的起始状态，经过EPSILON到达a和b的起始状态
        if (input === Input.EPSILON) {
          transform.set(input, new StateSet([a.initialState, b.initialState]));
        } else {
          transform.set(input, new StateSet());
        }
      } else {
        const nextA = a.next(input, state);
        const nextB = b.next(input, state);

        transform.set(input, StateSet.union(nextA, nextB));
      }
    }

    map.set(state, transform);
  }

  return new NondeterministicFiniteAutomachine(
    `(${a.name}|${b.name})`,
    map,
    initialState,
    finalStates,
  );
};

// 连接运算
export const concat = (a: NondeterministicFiniteAutomachine, b: NondeterministicFiniteAutomachine) => {
  const inputSet = StateSet.union(a.inputSet, b.inputSet);

  inputSet.add(Input.EPSILON);

  const stateSet = StateSet.union(a.stateSet, b.stateSet);

  // 计算新的转换函数
  const map = new NFATransformTable();

  for (const state of stateSet) {
    const transform = new NFATransform();

    for (const input of inputSet) {
      const nextStates = StateSet.union(a.next(input, state), b.next(input, state));

      if (a.finalStates.has(state) && input === Input.EPSILON) {
        // 针对a的每一个接受状态，增加一个EPSILON到q2的起始状态
        nextStates.add(b.initialState);
      }

      transform.set(input, nextStates);
    }

    map.set(state, transform);
  }

  return new NondeterministicFiniteAutomachine(
    `${a.name}${b.name}`,
    map,
    a.initialState,
    b.finalStates,
  );
};

// 星号运算
export const star = (nfa: NondeterministicFiniteAutomachine) => {
  // 新的起始状态
  const initialState = new State(`^${nfa.initialState.name}*`);

  // 新的起始状态也是接受状态
  const finalStates = new StateSet(nfa.finalStates);

  finalStates.add(initialState);

  const inputSet = new StateSet(nfa.inputSet);

  // 新的起始状态经过EPSILON到达原有的起始状态
  inputSet.add(Input.EPSILON);

  const stateSet = new StateSet(nfa.stateSet);

  stateSet.add(initialState);

  // 计算新的转换函数
  const map = new NFATransformTable();

  for (const state of stateSet) {
    const transform = new NFATransform();

    for (const input of inputSet) {
      if (state === initialState) {
        if (input === Input.EPSILON) { // 新的起始状态经过EPSILON到达旧的起始状态
          transform.set(input, new StateSet([nfa.initialState]));
        } else {
          transform.set(input, StateSet.None);
        }
      } else if (nfa.finalStates.has(state) && input === Input.EPSILON) { // 给旧的接受状态增加经过EPSILON到达旧的起始状态的转换
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
    `(${nfa.name}*)`,
    map,
    initialState,
    finalStates,
  );
};
