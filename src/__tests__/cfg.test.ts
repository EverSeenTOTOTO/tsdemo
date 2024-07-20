import {
  CFGInput,
  CFGRuleSet,
  CFGDerivations,
  ContextFreeGrammar,
} from '../ContextFreeGrammar';

describe('test CFG', () => {
  const S = new CFGInput('S', false);
  const A = new CFGInput('A', false);
  const B = new CFGInput('B', false);
  const a = new CFGInput('a', true);
  const b = new CFGInput('b', true);

  test('test constructor', () => {
    const cfg = new ContextFreeGrammar(
      'CFG',
      new CFGDerivations([
        [
          S,
          new CFGRuleSet([
            [A, S, A],
            [a, B],
          ]),
        ],
        [A, new CFGRuleSet([[B], [S]])],
        [B, new CFGRuleSet([[b], [CFGInput.EPSILON]])],
      ]),
      S,
    );

    console.log(cfg.toString());
    expect(cfg.NonTerms.vs()).toEqual([S, A, B]);
    expect(cfg.Terms.vs()).toEqual([a, b]);
  });
});
