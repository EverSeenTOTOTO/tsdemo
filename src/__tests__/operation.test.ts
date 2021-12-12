import {
  EPSILON,
  Input,
  NondeterministicFiniteAutomachine, State,
} from '@/FiniteStateMachine';
import { concat, star, union } from '@/Operation';
import { ExtendMap, ExtendSet } from '@/utils';

describe('test Operation', () => {
  const q1 = new State('q1');
  const q2 = new State('q2');
  const q3 = new State('q3');
  const q4 = new State('q4');
  const a = new Input('a');
  const b = new Input('b');

  test('test union', () => {
    const N1 = new NondeterministicFiniteAutomachine(
      'N1',
      new ExtendMap([
        [
          q1,
          new ExtendMap([
            [
              a,
              new ExtendSet([q2]),
            ],
          ]),
        ],
      ]),
      q1,
      new ExtendSet([q2]),
    );
    const N2 = new NondeterministicFiniteAutomachine(
      'N2',
      new ExtendMap([
        [
          q1,
          new ExtendMap([
            [
              a,
              new ExtendSet([q3]),
            ],
          ]),
        ],
        [
          q2,
          new ExtendMap([
            [
              b,
              new ExtendSet([q3]),
            ],
          ]),
        ],
      ]),
      q2,
      new ExtendSet([q3]),
    );

    const U = union(N1, N2);

    expect(U.initialState.name).toBe(`${N1.initialState.name} U ${N2.initialState.name}`);
    expect(U.finalStates.vs()).toEqual([
      ...N1.finalStates.vs(),
      ...N2.finalStates.vs(),
    ]);
    expect(U.next(q3, U.initialState).length).toBe(0);
    expect(U.next(EPSILON, U.initialState).vs()).toEqual([
      N1.initialState,
      N2.initialState,
    ]);
    expect(U.next(a, q1).vs()).toEqual([
      q2, q3,
    ]);
    expect(U.next(b, q2).vs()).toEqual([
      q3,
    ]);
  });

  test('test concat', () => {
    const N1 = new NondeterministicFiniteAutomachine(
      'N1',
      new ExtendMap([
        [
          q1,
          new ExtendMap([
            [
              a,
              new ExtendSet([q2]),
            ],
          ]),
        ],
        [
          q2,
          new ExtendMap([
            [
              b,
              new ExtendSet([q3]),
            ],
          ]),
        ],
      ]),
      q1,
      new ExtendSet([q2, q3]),
    );
    const N2 = new NondeterministicFiniteAutomachine(
      'N2',
      new ExtendMap([
        [
          q3,
          new ExtendMap([
            [
              a,
              new ExtendSet([q1, q4]),
            ],
          ]),
        ],
        [
          q2,
          new ExtendMap([
            [
              b,
              new ExtendSet([q4]),
            ],
          ]),
        ],
      ]),
      q3,
      new ExtendSet([q4]),
    );

    const C = concat(N1, N2);

    expect(C.initialState).toBe(N1.initialState);
    expect(C.finalStates).toEqual(N2.finalStates);
    expect(C.next(a, q3).vs()).toEqual([
      q1, q4,
    ]);
    expect(C.next(b, q2).vs()).toEqual([
      q3, q4,
    ]);
    expect(C.next(EPSILON, q3).vs()).toEqual([
      q3,
    ]);
  });

  test('test star', () => {
    const N = new NondeterministicFiniteAutomachine(
      'N',
      new ExtendMap([
        [
          q1,
          new ExtendMap([
            [
              a,
              new ExtendSet([q2]),
            ],
          ]),
        ],
        [
          q2,
          new ExtendMap([
            [
              EPSILON,
              new ExtendSet([q2]),
            ],
          ]),
        ],
      ]),
      q1,
      new ExtendSet([q2]),
    );

    const S = star(N);

    expect(S.name).toBe(`${N.name}*`);
    expect(S.finalStates).toBe(N.finalStates);
    expect(S.next(EPSILON, S.initialState).vs()).toEqual([
      q1,
    ]);
    expect(S.next(EPSILON, q2).vs()).toEqual([
      q2, q1,
    ]);
  });
});
