import { Input } from '@/FiniteStateMachine';
import {
  chainRegex,
  ConcatRegularExpression, LiteralRegularExpression, StarRegularExpression, UnionRegularExpression,
} from '../RegularExpression';

describe('test RegularExpression', () => {
  const a = new Input('a');
  const b = new Input('b');

  test('test literal', () => {
    const R = new LiteralRegularExpression(a);

    expect(R.source.name).toBe('a');
    expect(R.match([a])).toBe(true);

    // different reference
    expect(R.match([new Input('a')])).toBe(false);
  });

  test('test concat', () => {
    const R1 = new LiteralRegularExpression(a);
    const R2 = new LiteralRegularExpression(b);
    const R = new ConcatRegularExpression(R1, R2);

    expect(R.left).toBe(R1);

    expect(R.match([a])).toBe(false);
    expect(R.match([a, b])).toBe(true);
    expect(R.match([b, a])).toBe(false);
    expect(R.match([a, b, a])).toBe(false);
  });

  test('test union', () => {
    const R1 = new LiteralRegularExpression(a);
    const R2 = new LiteralRegularExpression(b);
    const R = new UnionRegularExpression(R1, R2);

    expect(R.right).toBe(R2);

    expect(R.match([a])).toBe(true);
    expect(R.match([b])).toBe(true);
  });

  test('test star', () => {
    const R = new LiteralRegularExpression(a);
    const RStar = new StarRegularExpression(R);

    expect(RStar.match([])).toBe(true);
    expect(RStar.match([a])).toBe(true);
    expect(RStar.match(
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line prefer-spread
      Array.apply(null, { length: 1000 }).map(() => a),
    )).toBe(true);
  });

  test('test chain', () => {
    // a
    let chain = chainRegex(new LiteralRegularExpression(a));

    // aa
    chain = chain.concat(new LiteralRegularExpression(a));

    expect(chain.match([a])).toBe(false);
    expect(chain.match([a, a])).toBe(true);

    // aab*
    chain = chain.concat(chainRegex(new LiteralRegularExpression(b)).star().regex);

    expect(chain.match([a, a])).toBe(true);
    expect(chain.match([a, a, b, b, b])).toBe(true);
    expect(chain.match([a, a, b, b, b, a])).toBe(false);

    expect(chain.match([b])).toBe(false);
    // aab*|b*
    chain = chain.union(chainRegex(new LiteralRegularExpression(b)).star().regex);

    expect(chain.match([b])).toBe(true);
    expect(chain.match([])).toBe(true);
    expect(chain.match([a])).toBe(false);
  });
});
