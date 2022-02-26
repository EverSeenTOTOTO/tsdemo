import {
  Input, NondeterministicFiniteAutomachine, State,
} from '@/FiniteStateMachine';
import {
  getNextStates, NFA2DFA, findStateInSubstates,
} from '@/Transform';
import { ExtendMap, ExtendSet } from '@/utils';

describe('test transform', () => {
  const q1 = new State('q1');
  const q2 = new State('q2');
  const q3 = new State('q3');
  const a = new Input('a');
  const b = new Input('b');

  const N = new NondeterministicFiniteAutomachine(
    'N',
    new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>([
      [
        q1,
        new ExtendMap([
          [Input.EPSILON, new ExtendSet([q3])],
          [a, new ExtendSet()],
          [b, new ExtendSet([q2])],
        ]),
      ],
      [
        q2,
        new ExtendMap([
          [Input.EPSILON, new ExtendSet()],
          [a, new ExtendSet([q2, q3])],
          [b, new ExtendSet([q3])],
        ]),
      ],
      [
        q3,
        new ExtendMap([
          [Input.EPSILON, new ExtendSet([q2])],
          [a, new ExtendSet([q1])],
          [b, new ExtendSet()],
        ]),
      ],
    ]),
    q1,
    new ExtendSet([q1]),
  );

  test('test getNextStates', () => {
    expect(getNextStates(N, Input.EPSILON, q1).vs()).toEqual([q3, q2]);
    expect(getNextStates(N, a, q2).vs()).toEqual([
      q2, q3,
    ]);
    expect(getNextStates(N, a, q3).vs()).toEqual([
      q1, q3, q2,
    ]);
  });

  test('test NFA2DFA', () => {
    const M = NFA2DFA(N);

    const sq2q3 = findStateInSubstates(M.stateSet, new ExtendSet([q2, q3]));
    const sq1q2q3 = findStateInSubstates(M.stateSet, new ExtendSet([q1, q2, q3]));

    expect(M.next(a, sq2q3)).toBe(sq1q2q3);
    expect(M.next(b, sq2q3)).toBe(sq2q3);
    expect(M.next(a, sq1q2q3)).toBe(sq1q2q3);
    expect(M.next(b, sq1q2q3)).toBe(sq2q3);
  });
});
