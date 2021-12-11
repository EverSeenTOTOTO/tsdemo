import {
  EPSILON, Input, NondeterministicFiniteAutomachine, State,
} from '@/FiniteStateMachine';
import {
  getNextStates, getSubset, getSubsetState, NFA2DFA, SubState,
} from '@/Transform';

describe('test transform', () => {
  const q1 = new State('q1');
  const q2 = new State('q2');
  const q3 = new State('q3');
  const a = new Input('a');
  const b = new Input('b');

  test('test getSubset', () => {
    expect(getSubset(new Set<State>()).vals().length).toBe(1);
    expect(getSubset(new Set([q1, q2])).vals().length).toBe(4);
    expect(getSubset(new Set([q1, q2, q3])).vals().length).toBe(2 ** 3);
    expect(getSubset(new Set([q1, q2, q1, q2, q3])).vals().length).toBe(2 ** 3);
  });

  test('test getNextStates', () => {
    const N = new NondeterministicFiniteAutomachine(
      'N',
      new Map<State, Map<Input, Set<State>>>([
        [
          q1,
          new Map([
            [EPSILON, new Set([q3])],
            [a, new Set()],
            [b, new Set([q2])],
          ]),
        ],
        [
          q2,
          new Map([
            [EPSILON, new Set()],
            [a, new Set([q2, q3])],
            [b, new Set([q3])],
          ]),
        ],
        [
          q3,
          new Map([
            [EPSILON, new Set([q2])],
            [a, new Set([q1])],
            [b, new Set()],
          ]),
        ],
      ]),
      q1,
      new Set([q1]),
    );

    expect(getNextStates(N, EPSILON, q1).vals()).toEqual([q3, q2]);
    expect(getNextStates(N, a, q2).vals()).toEqual([
      q2, q3,
    ]);
    expect(getNextStates(N, a, q3).vals()).toEqual([
      q1, q3, q2,
    ]);

    const M = NFA2DFA(N);

    const sq1 = getSubsetState(M.avaliableStates as Set<SubState>, [q1]);
    const sq1q2 = getSubsetState(M.avaliableStates as Set<SubState>, [q1, q2]);

    expect(N.avaliableInputs.vals()).toEqual(M.avaliableInputs.vals());
    console.log(M.next(a, sq1));
    console.log(M.next(EPSILON, sq1q2));
  });
});
