import {
  Input,
  State,
  StateSet,
  DFATransform,
  DFATransformTable,
  DeterministicFinitAutomachine,
} from '@/FiniteStateMachine';
import { DFA2GNFA, DFA2Regex } from '@/RegularExpression';
import { accept } from '@/Transform';

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

  const q3 = new State('q3');

  test('test DFA2Regex2', () => {
    const dfa = new DeterministicFinitAutomachine(
      'M',
      new DFATransformTable([
        [
          q1,
          new DFATransform([
            [a, q2],
            [b, q3],
          ]),
        ],
        [
          q2,
          new DFATransform([
            [a, q1],
            [b, q2],
          ]),
        ],
        [
          q3,
          new DFATransform([
            [a, q2],
            [b, q1],
          ]),
        ],
      ]),
      q1,
      new StateSet([q2, q3]),
    );

    const regex = DFA2Regex(dfa);

    console.log(regex?.toString());
    console.log(regex?.toNFA().toString());

    expect(accept(dfa, [a])).toBe(true);
    expect(accept(dfa, [a, b])).toBe(true);
    expect(accept(dfa, [a, a, b])).toBe(true);
    expect(accept(dfa, [a, a, b, b])).toBe(false);
    expect(accept(dfa, [a, a, a, b])).toBe(true);
    expect(accept(dfa, [a, b, b, b])).toBe(true);
    expect(accept(dfa, [b, b, b])).toBe(true);
    expect(accept(dfa, [b, b, b, a])).toBe(true);
    expect(accept(dfa, [b, b, b, a, a])).toBe(false);

    expect(regex?.match([a])).toBe(true);
    expect(regex?.match([a, b])).toBe(true);
    expect(regex?.match([a, a, b])).toBe(true);
    expect(regex?.match([a, a, b, b])).toBe(false);
    expect(regex?.match([a, a, a, b])).toBe(true);
    expect(regex?.match([a, b, b, b])).toBe(true);
    expect(regex?.match([b, b, b])).toBe(true);
    expect(regex?.match([b, b, b, a])).toBe(true);
    expect(regex?.match([b, b, b, a, a])).toBe(false);
  });
});
