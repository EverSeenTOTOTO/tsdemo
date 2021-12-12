import {
  DeterministicFinitAutomachine, EPSILON, Input, NondeterministicFiniteAutomachine, RESET, State,
} from '@/FiniteStateMachine';
import { ExtendMap, ExtendSet } from '@/utils';

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
      new ExtendMap<State, ExtendMap<Input, State>>([
        [
          q1,
          new ExtendMap<Input, State>([
            [i0, q1],
            [i1, q2],
          ]),
        ],
        [
          q2,
          new ExtendMap<Input, State>([
            [i0, q3],
            [i1, q2],
          ]),
        ],
        [
          q3,
          new ExtendMap<Input, State>([
            [i0, q2],
            [i1, q2],
          ]),
        ],
      ]),
      q1,
      new ExtendSet([q2]),
    );

    expect(M.stateSet.vs()).toEqual([q1, q2, q3]);
    expect(M.inputSet.vs()).toEqual([i0, i1]);
    expect(M.next(i0)).toBe(q1);
    expect(M.run([])).toEqual([q1]);

    let currentState = M.initialState;
    const next = (input: Input) => {
      currentState = M.next(input, currentState) ?? currentState;
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

  test('test NFA', () => {
    const M = new NondeterministicFiniteAutomachine(
      'M',
      new ExtendMap<State, ExtendMap<Input, ExtendSet<State>>>([
        [
          q1,
          new ExtendMap<Input, ExtendSet<State>>([
            [i0, new ExtendSet([q1])],
            [i1, new ExtendSet([q1, q2])],
            [EPSILON, new ExtendSet()],
          ]),
        ],
        [
          q2,
          new ExtendMap<Input, ExtendSet<State>>([
            [i0, new ExtendSet([q2])],
            [i1, new ExtendSet()],
            [EPSILON, new ExtendSet([q3])],
          ]),
        ],
        [
          q3,
          new ExtendMap<Input, ExtendSet<State>>([
            [i0, new ExtendSet()],
            [i1, new ExtendSet([q1])],
            [EPSILON, new ExtendSet()],
          ]),
        ],
        [
          q4,
          new ExtendMap<Input, ExtendSet<State>>([
            [i0, new ExtendSet([q4])],
            [i1, new ExtendSet([q4])],
            [EPSILON, new ExtendSet()],
          ]),
        ],
      ]),
      q1,
      new ExtendSet([q4]),
    );

    expect(M.stateSet.vs()).toEqual([q1, q2, q3, q4]);
    expect(M.inputSet.vs()).toEqual([i0, i1, EPSILON]);

    expect(M.next(RESET).vs()).toEqual([]);
    expect(M.next(i1, q1).vs()).toEqual([q1, q2]);

    expect(M.isFinal(q2)).toBe(false);
  });
});
