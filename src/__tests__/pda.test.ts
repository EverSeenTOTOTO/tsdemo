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
        q1,
        new PDATransform([
          [Input.EPSILON, new ExtendSet([[q2, Input.EPSILON, Input.$]])],
        ]),
      ],
      [
        q2,
        new PDATransform([
          [a, new ExtendSet([[q2, Input.EPSILON, a]])],
          [b, new ExtendSet([[q3, a, Input.EPSILON]])],
        ]),
      ],
      [
        q3,
        new PDATransform([
          [b, new ExtendSet([[q3, a, Input.EPSILON]])],
          [Input.EPSILON, new ExtendSet([[q4, Input.$, Input.EPSILON]])],
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
    expect(pda.next(Input.EPSILON).vs()[0]).toEqual([q2, Input.EPSILON, Input.$]);
  });
});
