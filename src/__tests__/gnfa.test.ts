import {
  Input,
  State,
  StateSet,
  DFATransform,
  DFATransformTable,
  DeterministicFinitAutomachine,
} from '@/FiniteStateMachine';
import { DFA2GNFA, DFA2Regex } from '@/RegularExpression';

describe('test GNFA', () => {
  const q1 = new State('q1');
  const q2 = new State('q2');
  const a = new Input('a');
  const b = new Input('b');

  test('test DFA2GNFA', () => {
    const dfa = new DeterministicFinitAutomachine(
      'M',
      new DFATransformTable([
        [
          q1,
          new DFATransform([
            [a, q1],
            [b, q2],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2]),
    );

    const gnfa = DFA2GNFA(dfa);

    console.log(gnfa.toString());

    expect(gnfa.stateSet.length).toBe(4);
  });

  test('test DFA2GNFA union', () => {
    const dfa = new DeterministicFinitAutomachine(
      'M',
      new DFATransformTable([
        [
          q1,
          new DFATransform([
            [a, q2],
            [b, q2],
          ]),
        ],
        [
          q2,
          new DFATransform([
            [a, q1],
            [b, q1],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2]),
    );

    const gnfa = DFA2GNFA(dfa);

    console.log(gnfa.toString());

    expect(gnfa.stateSet.length).toBe(4);
  });

  test('test DFA2Regex', () => {
    const dfa = new DeterministicFinitAutomachine(
      'M',
      new DFATransformTable([
        [
          q1,
          new DFATransform([
            [a, q1],
            [b, q2],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2]),
    );

    const regex = DFA2Regex(dfa);
    console.log(regex?.toNFA().toString());

    expect(regex?.toString()).toBe('(((ε(a*))b)ε)');
    expect(regex?.match([a])).toBe(false);
    expect(regex?.match([a, b])).toBe(true);
    expect(regex?.match([a, a, a, a])).toBe(false);
    expect(regex?.match([a, a, a, a, a, a, b])).toBe(true);
    expect(regex?.match([a, a, a, a, a, a, b, b])).toBe(false);
  });
});
