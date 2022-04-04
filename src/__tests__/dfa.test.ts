import { ExtendSet } from '@/utils';
import {
  Input,
  State,
  DFATransform,
  DFATransformTable,
  DeterministicFinitAutomachine,
} from '../FiniteStateMachine';
import { run } from '../Transform';

class OutputState extends State {
  output: string;

  constructor(name: string, output: string) {
    super(name);
    this.output = output;
  }
}

describe('test DFA', () => {
  const q1 = new OutputState('q1', '0');
  const q2 = new OutputState('q2', '0');
  const q3 = new OutputState('q3', '0');
  const q4 = new OutputState('q4', '1');

  const i0 = new Input('0');
  const i1 = new Input('1');

  it('Gedanken experiments on subsequential machines', () => {
    const createMachine = (initialState: OutputState) => {
      return new DeterministicFinitAutomachine<OutputState>(
        'DFA',
        new DFATransformTable([
          [
            q1,
            new DFATransform([
              [i0, q4],
              [i1, q3],
            ]),
          ],
          [
            q2,
            new DFATransform([
              [i0, q1],
              [i1, q3],
            ]),
          ],
          [
            q3,
            new DFATransform([
              [i0, q4],
              [i1, q4],
            ]),
          ],
          [
            q4,
            new DFATransform([
              [i0, q2],
              [i1, q2],
            ]),
          ],
        ]),
        initialState,
        new ExtendSet([q1, q2, q3, q4]),
      );
    };

    const M1 = createMachine(q1);
    const r1 = run(M1, [i0, i0, i0, i1, i0, i0, i0, i1, i0]);
    expect(r1.map((s) => s.output)).toEqual(['0', '1', '0', '0', '0', '1', '0', '0', '0', '1']);

    const M2 = createMachine(q2);
    const r2 = run(M2, [i0, i0, i0, i1, i0, i0, i0, i1, i0]);
    expect(r2.map((s) => s.output)).toEqual(['0', '0', '1', '0', '0', '1', '0', '0', '0', '1']);

    const M3 = createMachine(q3);
    const r3 = run(M3, [i0, i0, i0, i1, i0, i0, i0, i1, i0]);
    expect(r3.map((s) => s.output)).toEqual(['0', '1', '0', '0', '0', '1', '0', '0', '0', '1']);

    const M4 = createMachine(q4);
    const r4 = run(M4, [i0, i0, i0, i1, i0, i0, i0, i1, i0]);
    expect(r4.map((s) => s.output)).toEqual(['1', '0', '0', '1', '0', '0', '1', '0', '0', '1']);
  });
});
