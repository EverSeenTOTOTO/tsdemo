import {
  EPSILON, Input, NondeterministicFiniteAutomachine, State,
} from '@/FiniteStateMachine';
import {
  getSubsets, getNextStates, NFA2DFA, findStateSetInSubsets, StateSet,
} from '@/Transform';
import { ExtendMap, ExtendSet } from '@/utils';

describe('test transform', () => {
  const q1 = new State('q1');
  const q2 = new State('q2');
  const q3 = new State('q3');
  const a = new Input('a');
  const b = new Input('b');

  test('test getSubset', () => {
    expect(getSubsets(new ExtendSet<State>()).vs().length).toBe(1);
    expect(getSubsets(new ExtendSet([q1, q2])).vs().length).toBe(4);
    expect(getSubsets(new ExtendSet([q1, q2, q3])).vs().length).toBe(2 ** 3);
    expect(getSubsets(new ExtendSet([q1, q2, q1, q2, q3])).vs().length).toBe(2 ** 3);
  });

  test('test getNextStates', () => {
    const N = new NondeterministicFiniteAutomachine(
      'N',
      new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>([
        [
          q1,
          new ExtendMap([
            [EPSILON, new ExtendSet([q3])],
            [a, new ExtendSet()],
            [b, new ExtendSet([q2])],
          ]),
        ],
        [
          q2,
          new ExtendMap([
            [EPSILON, new ExtendSet()],
            [a, new ExtendSet([q2, q3])],
            [b, new ExtendSet([q3])],
          ]),
        ],
        [
          q3,
          new ExtendMap([
            [EPSILON, new ExtendSet([q2])],
            [a, new ExtendSet([q1])],
            [b, new ExtendSet()],
          ]),
        ],
      ]),
      q1,
      new ExtendSet([q1]),
    );

    expect(getNextStates(N, EPSILON, q1).vs()).toEqual([q3, q2]);
    expect(getNextStates(N, a, q2).vs()).toEqual([
      q2, q3,
    ]);
    expect(getNextStates(N, a, q3).vs()).toEqual([
      q1, q3, q2,
    ]);

    const M = NFA2DFA(N);

    const sq1 = findStateSetInSubsets(M.avaliableStates, new ExtendSet([q1]));
    const sq1q2 = findStateSetInSubsets(M.avaliableStates, new ExtendSet([q1, q2]));
    const sq2q3 = findStateSetInSubsets(M.avaliableStates, new ExtendSet([q2, q3]));

    expect(N.avaliableInputs.vs()).toEqual([
      EPSILON,
      ...M.avaliableInputs.vs(),
    ]);
    console.log(M.next(a, sq1));
    console.log(M.next(EPSILON, sq1q2));
    console.log(M.next(a, sq2q3));
  });
});
