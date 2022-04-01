import {
  Input,
  State, StateSet,
} from '@/FiniteStateMachine';
import { ExtendSet } from '@/utils';
import {
  PDATransform,
  PDATransformTable,
  PushdownAutomaton,
} from '../PushdownAutomata';

describe('test PDA', () => {
  const a = new Input('0');
  const b = new Input('1');
  const q1 = new State('q1');
  const q2 = new State('q2');
  const q3 = new State('q3');
  const q4 = new State('q4');

  const pda = new PushdownAutomaton(
    'P',
    new PDATransformTable([
      [
        [q1, Input.EPSILON],
        new PDATransform([
          [Input.EPSILON, new ExtendSet([[q2, Input.$]])],
        ]),
      ],
      [
        [q2, Input.EPSILON],
        new PDATransform([
          [a, new ExtendSet([[q2, a]])],
        ]),
      ],
      [
        [q2, a],
        new PDATransform([
          [b, new ExtendSet([[q3, Input.EPSILON]])],
        ]),
      ],
      [
        [q3, a],
        new PDATransform([
          [b, new ExtendSet([[q3, Input.EPSILON]])],
        ]),
      ],
      [
        [q3, Input.$],
        new PDATransform([
          [Input.EPSILON, new ExtendSet([[q4, Input.EPSILON]])],
        ]),
      ],
    ]),
    q1,
    new StateSet([q1, q4]),
  );

  test('test constructor', () => {
    console.log(pda.toString());

    expect(pda.initialState).toBe(q1);
    expect(pda.finalStates.vs()).toEqual([q1, q4]);
    expect(pda.inputSet.vs()).toEqual([Input.EPSILON, a, b]);
    expect(pda.stateSet.vs()).toEqual([q1, q2, q3, q4]);
  });

  test('test next', () => {
    expect(pda.next(a).vs()).toEqual([]);
    expect(pda.next(Input.EPSILON).vs()).toEqual([]);
    expect(pda.next(a, [q2, Input.EPSILON]).vs()[0]).toEqual([q2, a]);
    expect(pda.next(b, [q3, a]).vs()[0]).toEqual([q3, Input.EPSILON]);
  });
});
