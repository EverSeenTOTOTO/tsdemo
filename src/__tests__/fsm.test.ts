import {
  State, DeterministicFinitAutomachine, Input, RESET, NondeterministicFiniteAutomachine, EPSILON,
} from '@/FiniteStateMachine';

describe('FiniteStateMachine', () => {
  const q1 = new State('q1');
  const q2 = new State('q2');
  const q3 = new State('q3');
  const q4 = new State('q4');
  const i0 = new Input('0');
  const i1 = new Input('1');

  test('test DFA', () => {
    const M = new DeterministicFinitAutomachine(
      'M',
      new Map<State, Map<Input, State>>([
        [
          q1,
          new Map<Input, State>([
            [i0, q1],
            [i1, q2],
          ]),
        ],
        [
          q2,
          new Map<Input, State>([
            [i0, q3],
            [i1, q2],
          ]),
        ],
        [
          q3,
          new Map<Input, State>([
            [i0, q2],
            [i1, q2],
          ]),
        ],
      ]),
      q1,
      new Set([q2]),
    );

    expect(M.avaliableStates.vals()).toEqual([q1, q2, q3]);
    expect(M.avaliableInputs.vals()).toEqual([i0, i1]);
    expect(M.next(i0)).toBe(q1);
    expect(M.run([])).toEqual([q1]);

    let currentState = M.initialState;
    const next = (input: Input) => {
      currentState = M.next(input, currentState);
    };

    next(i1);

    expect(currentState).toBe(q2);
    expect(M.isFinal(currentState)).toBe(true);

    next(i0);

    expect(currentState).toBe(q3);

    next(RESET);
    next(new Input('2'));

    expect(currentState).toBe(M.initialState);

    const serial = M.run([
      RESET,
      i1,
      i0,
      RESET,
      i1,
      i1,
      i0,
    ], currentState);

    expect(serial).toEqual([
      q1,
      q1,
      q2,
      q3,
      q1,
      q2,
      q2,
      q3,
    ]);
  });

  test('test DFA', () => {
    const M = new NondeterministicFiniteAutomachine(
      'M',
      new Map<State, Map<Input, Set<State>>>([
        [
          q1,
          new Map<Input, Set<State>>([
            [i0, new Set([q1])],
            [i1, new Set([q1, q2])],
            [EPSILON, new Set()],
          ]),
        ],
        [
          q2,
          new Map<Input, Set<State>>([
            [i0, new Set([q2])],
            [i1, new Set()],
            [EPSILON, new Set([q3])],
          ]),
        ],
        [
          q3,
          new Map<Input, Set<State>>([
            [i0, new Set()],
            [i1, new Set([q1])],
            [EPSILON, new Set()],
          ]),
        ],
        [
          q4,
          new Map<Input, Set<State>>([
            [i0, new Set([q4])],
            [i1, new Set([q4])],
            [EPSILON, new Set()],
          ]),
        ],
      ]),
      q1,
      new Set([q4]),
    );

    expect(M.avaliableStates.vals()).toEqual([q1, q2, q3, q4]);
    expect(M.avaliableInputs.vals()).toEqual([i0, i1, EPSILON]);

    expect(M.next(RESET).vals()).toEqual([]);
    expect(M.next(i1, q1).vals()).toEqual([q1, q2]);

    expect(M.isFinal(q2)).toBe(false);
  });
});
