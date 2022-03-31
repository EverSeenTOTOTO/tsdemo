import {
  Input,
  State,
  NondeterministicFiniteAutomachine,
  NFATransformTable,
  NFATransform,
  StateSet,
} from '@/FiniteStateMachine';
import { concat, star, union } from '@/Operation';

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
      new NFATransformTable([
        [
          q1,
          new NFATransform([
            [
              a,
              new StateSet([q2]),
            ],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2]),
    );
    const N2 = new NondeterministicFiniteAutomachine(
      'N2',
      new NFATransformTable([
        [
          q1,
          new NFATransform([
            [
              a,
              new StateSet([q3]),
            ],
          ]),
        ],
        [
          q2,
          new NFATransform([
            [
              b,
              new StateSet([q3]),
            ],
          ]),
        ],
      ]),
      q2,
      new StateSet([q3]),
    );

    const U = union(N1, N2);

    expect(U.finalStates.vs()).toEqual([
      ...N1.finalStates.vs(),
      ...N2.finalStates.vs(),
    ]);
    expect(U.next(q3, U.initialState).length).toBe(0);
    expect(U.next(Input.EPSILON, U.initialState).vs()).toEqual([
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
      new NFATransformTable([
        [
          q1,
          new NFATransform([
            [
              a,
              new StateSet([q2]),
            ],
          ]),
        ],
        [
          q2,
          new NFATransform([
            [
              b,
              new StateSet([q3]),
            ],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2, q3]),
    );
    const N2 = new NondeterministicFiniteAutomachine(
      'N2',
      new NFATransformTable([
        [
          q3,
          new NFATransform([
            [
              a,
              new StateSet([q1, q4]),
            ],
          ]),
        ],
        [
          q2,
          new NFATransform([
            [
              b,
              new StateSet([q4]),
            ],
          ]),
        ],
      ]),
      q3,
      new StateSet([q4]),
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
    expect(C.next(Input.EPSILON, q3).vs()).toEqual([
      q3,
    ]);
  });

  test('test star', () => {
    const N = new NondeterministicFiniteAutomachine(
      'N',
      new NFATransformTable([
        [
          q1,
          new NFATransform([
            [
              a,
              new StateSet([q2]),
            ],
          ]),
        ],
        [
          q2,
          new NFATransform([
            [
              Input.EPSILON,
              new StateSet([q2]),
            ],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2]),
    );

    const S = star(N);

    expect(S.finalStates.vs()).toEqual([
      ...N.finalStates.vs(),
      S.initialState,
    ]);
    expect(S.next(Input.EPSILON, S.initialState).vs()).toEqual([
      q1,
    ]);
    expect(S.next(Input.EPSILON, q2).vs()).toEqual([
      q2, q1,
    ]);
  });

  test('test combine operations', () => {
    const N1 = new NondeterministicFiniteAutomachine(
      'N1',
      new NFATransformTable([
        [
          q1,
          new NFATransform([
            [
              a,
              new StateSet([q2]),
            ],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2]),
    );
    const N2 = new NondeterministicFiniteAutomachine(
      'N2',
      new NFATransformTable([
        [
          q2,
          new NFATransform([
            [
              b,
              new StateSet([q3]),
            ],
          ]),
        ],
      ]),
      q2,
      new StateSet([q3]),
    );

    const next = (nfa: NondeterministicFiniteAutomachine, input: Input, state?: State) => nfa.next(input, state).vs()[0];

    const C = concat(N1, N2);
    const accept = next(C, b, next(C, a));

    expect(accept).toBe(q3);
    expect(next(N2, b, next(N1, a))).toBe(accept);

    const S = star(C);
    const once = (time: number) => {
      let i = 0;
      let state = S.initialState;
      while (i < time) {
        state = next(S, Input.EPSILON, next(S, b, next(S, a)));
        i += 1;
      }

      state = next(S, a, state);
      return state;
    };

    expect(once(4)).toBe(q2);
    expect(once(1)).toBe(once(99));
  });
});
