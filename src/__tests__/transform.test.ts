import {
  Input,
  State,
  StateSet,
  NFATransform,
  NFATransformTable,
  NondeterministicFiniteAutomachine,
} from '@/FiniteStateMachine';
import {
  getNextStates, NFA2DFA, findStateInSubstates,
} from '@/Transform';

describe('test transform', () => {
  const q1 = new State('q1');
  const q2 = new State('q2');
  const q3 = new State('q3');
  const a = new Input('a');
  const b = new Input('b');

  const N = new NondeterministicFiniteAutomachine(
    'N',
    new NFATransformTable([
      [
        q1,
        new NFATransform([
          [Input.EPSILON, new StateSet([q3])],
          [a, new StateSet()],
          [b, new StateSet([q2])],
        ]),
      ],
      [
        q2,
        new NFATransform([
          [Input.EPSILON, new StateSet()],
          [a, new StateSet([q2, q3])],
          [b, new StateSet([q3])],
        ]),
      ],
      [
        q3,
        new NFATransform([
          [Input.EPSILON, new StateSet([q2])],
          [a, new StateSet([q1])],
          [b, new StateSet()],
        ]),
      ],
    ]),
    q1,
    new StateSet([q1]),
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

    const sq2q3 = findStateInSubstates(M.stateSet, new StateSet([q2, q3]));
    const sq1q2q3 = findStateInSubstates(M.stateSet, new StateSet([q1, q2, q3]));

    expect(M.next(a, sq2q3)).toBe(sq1q2q3);
    expect(M.next(b, sq2q3)).toBe(sq2q3);
    expect(M.next(a, sq1q2q3)).toBe(sq1q2q3);
    expect(M.next(b, sq1q2q3)).toBe(sq2q3);
  });
});
