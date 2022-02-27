import {
  Input,
  State,
  StateSet,
  DFATransform,
  NFATransform,
  DeterministicFinitAutomachine,
  NondeterministicFiniteAutomachine,
  DFATransformTable,
  NFATransformTable,
} from '@/FiniteStateMachine';
import { accept } from '@/Transform';

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
      new DFATransformTable([
        [
          q1,
          new DFATransform([
            [i0, q1],
            [i1, q2],
          ]),
        ],
        [
          q2,
          new DFATransform([
            [i0, q3],
            [i1, q2],
          ]),
        ],
        [
          q3,
          new DFATransform([
            [i0, q2],
            [i1, q2],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2]),
    );

    expect(M.stateSet.vs()).toEqual([q1, q2, q3]);
    expect(M.inputSet.vs()).toEqual([i0, i1]);
    expect(M.next(i0)).toBe(q1);
    expect(M.run([])).toEqual([q1]);

    expect(M.reverseTransforms.get(q2)?.get(i0)).toBe(q3);

    let currentState = M.initialState;
    const next = (input: Input) => {
      currentState = M.next(input, currentState) ?? currentState;
    };

    next(i1);

    expect(currentState).toBe(q2);
    expect(M.isFinal(currentState)).toBe(true);

    next(i0);

    expect(currentState).toBe(q3);

    next(Input.RESET);
    next(new Input('2'));

    expect(currentState).toBe(M.initialState);

    const serial = M.run([
      Input.RESET,
      i1,
      i0,
      Input.RESET,
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

    expect(accept(M, [
      Input.RESET,
      i1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line prefer-spread
      ...Array.apply(null, { length: 1000 }).map(() => i0),
      i0,
    ])).toBe(false);
    expect(accept(M, [
      Input.RESET,
      i1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line prefer-spread
      ...Array.apply(null, { length: 1000 }).map(() => i0),
      i1,
    ])).toBe(true);
  });

  test('test NFA', () => {
    const M = new NondeterministicFiniteAutomachine(
      'M',
      new NFATransformTable([
        [
          q1,
          new NFATransform([
            [i0, new StateSet([q1])],
            [i1, new StateSet([q1, q2])],
            [Input.EPSILON, StateSet.None],
          ]),
        ],
        [
          q2,
          new NFATransform([
            [i0, new StateSet([q2])],
            [i1, new StateSet([q4])],
            [Input.EPSILON, new StateSet([q3])],
          ]),
        ],
        [
          q3,
          new NFATransform([
            [i0, StateSet.None],
            [i1, new StateSet([q1])],
            [Input.EPSILON, StateSet.None],
          ]),
        ],
        [
          q4,
          new NFATransform([
            [i1, new StateSet([q2])],
            [Input.EPSILON, StateSet.None],
          ]),
        ],
      ]),
      q1,
      new StateSet([q4]),
    );

    expect(M.stateSet.vs()).toEqual([q1, q2, q3, q4]);

    expect(M.next(Input.RESET).vs()).toEqual([]);
    expect(M.next(i1, q1).vs()).toEqual([q1, q2]);
    expect(M.next(Input.EPSILON, q2).vs()).toEqual([q3]);

    expect(M.isFinal(q2)).toBe(false);

    const inputs = [
      Input.RESET,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line prefer-spread
      ...Array.apply(null, { length: 1000 }).map(() => i1),
      i0,
      i1,
      i0,
    ];

    // 不会接受以0结束的串
    expect(accept(M, inputs)).toBe(false);
    expect(accept(M, inputs.slice(0, inputs.length - 1))).toBe(true);
    expect(accept(M, inputs.slice(0, inputs.length - 2))).toBe(false);
  });
});
