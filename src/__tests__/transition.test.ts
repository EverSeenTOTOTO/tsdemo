import {
  CFGDerivations, CFGInput, CFGRuleSet, ContextFreeGrammar,
} from '@/ContextFreeGrammar';
import { CFG2PDA } from '../Transition';

describe('test transition', () => {
  const S = new CFGInput('S', false);
  const T = new CFGInput('T', false);
  const a = new CFGInput('a', true);
  const b = new CFGInput('b', true);

  it('test CFG2PDA', () => {
    const cfg = new ContextFreeGrammar(
      'CFG',
      new CFGDerivations([
        [
          S,
          new CFGRuleSet([
            [a, T, b],
            [b],
          ]),
        ],
        [
          T,
          new CFGRuleSet([
            [T, a],
            [CFGInput.EPSILON],
          ]),
        ],
      ]),
      S,
    );

    console.log(cfg.toString());
    const pda = CFG2PDA(cfg);
    console.log(pda.toString());

    const loop = pda.stateSet.vs().filter((s) => s.name === 'LOOP')[0];
    expect(loop).not.toBeUndefined();
    expect(pda.transforms.get(loop)?.get(a)?.vs()[0]).toEqual([loop, a, CFGInput.EPSILON]);
    expect(pda.transforms.get(loop)?.get(CFGInput.EPSILON)?.vs()?.length).toEqual(5);
  });
});
