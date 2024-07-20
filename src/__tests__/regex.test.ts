import { Input } from '@/FiniteStateMachine';
import {
  chainRegex,
  ConcatRegularExpression,
  EmptyRegularExpression,
  EpsilonRegularExpression,
  LiteralRegularExpression,
  StarRegularExpression,
  UnionRegularExpression,
} from '../RegularExpression';

describe('test RegularExpression', () => {
  const a = new Input('a');
  const b = new Input('b');

  test('test literal', () => {
    const R = new LiteralRegularExpression(a);

    expect(R.source).toBe(a);
    expect(R.match([a])).toBe(true);

    // different reference
    expect(R.match([new Input('a')])).toBe(false);
  });

  test('test epsilon', () => {
    const R = new EpsilonRegularExpression();

    expect(R.toString()).toBe(Input.EPSILON.name);
    expect(R.match([a])).toBe(false);
    expect(R.match([b])).toBe(false);
  });

  test('test empty', () => {
    const R = new EmptyRegularExpression();

    expect(R.toString()).toBe(Input.EMPTY.name);
    expect(R.match([])).toBe(false);
    expect(R.match([a])).toBe(false);
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

  test('test concat with epsilon', () => {
    // R EPSILON = R
    const Ra = new LiteralRegularExpression(a);
    const Rb = new LiteralRegularExpression(b);
    const R2 = new EpsilonRegularExpression();
    const R = new ConcatRegularExpression(
      new ConcatRegularExpression(Ra, Rb),
      R2,
    );

    expect(R.match([a])).toBe(false);
    expect(R.match([a, b])).toBe(true);
    expect(R.match([b, a])).toBe(false);
    expect(R.match([a, b, b])).toBe(false);
  });

  test('test union', () => {
    const R1 = new LiteralRegularExpression(a);
    const R2 = new LiteralRegularExpression(b);
    const R = new UnionRegularExpression(R1, R2);

    expect(R.right).toBe(R2);

    expect(R.match([a])).toBe(true);
    expect(R.match([b])).toBe(true);
  });

  test('test union with empty', () => {
    // R | EMPTY = R
    const Ra = new LiteralRegularExpression(a);
    const Rb = new LiteralRegularExpression(b);
    const R2 = new EmptyRegularExpression();
    const R = new UnionRegularExpression(
      new ConcatRegularExpression(Ra, Rb),
      R2,
    );

    expect(R.match([a])).toBe(false);
    expect(R.match([a, b])).toBe(true);
    expect(R.match([b, a])).toBe(false);
    expect(R.match([a, b, a])).toBe(false);
  });

  test('test star', () => {
    const R = new LiteralRegularExpression(a);
    const RStar = new StarRegularExpression(R);

    expect(RStar.match([])).toBe(true);
    expect(RStar.match([a])).toBe(true);
    expect(
      RStar.match(
        // @ts-ignore
        // eslint-disable-next-line prefer-spread
        Array.apply(null, { length: 1000 }).map(() => a),
      ),
    ).toBe(true);
  });

  test('test chain1', () => {
    // a
    let chain = chainRegex(new LiteralRegularExpression(a));

    // aa
    chain = chain.concat(new LiteralRegularExpression(a));

    expect(chain.match([a])).toBe(false);
    expect(chain.match([a, a])).toBe(true);

    // aab*
    chain = chain.concat(
      chainRegex(new LiteralRegularExpression(b)).star().regex,
    );

    expect(chain.match([a, a])).toBe(true);
    expect(chain.match([a, a, b, b, b])).toBe(true);
    expect(chain.match([a, a, b, b, b, a])).toBe(false);

    expect(chain.match([b])).toBe(false);
    // aab*|b*
    chain = chain.union(
      chainRegex(new LiteralRegularExpression(b)).star().regex,
    );

    expect(chain.match([b])).toBe(true);
    expect(chain.match([])).toBe(true);
    expect(chain.match([a])).toBe(false);

    // (aa(b*)|(b*))a
    chain = chain.concat(new LiteralRegularExpression(a));

    expect(chain.match([a])).toBe(true);
    expect(chain.match([b, a])).toBe(true);
    expect(chain.match([a, b, a])).toBe(false);
  });

  test('test chain2', () => {
    // a
    let chain = chainRegex(new LiteralRegularExpression(a));

    // aa
    chain = chain.concat(new LiteralRegularExpression(a));

    expect(chain.match([a])).toBe(false);
    expect(chain.match([a, a])).toBe(true);
    expect(chain.match([a, a, a])).toBe(false);

    // aaε
    chain = chain.concat(new EpsilonRegularExpression());

    expect(chain.match([a])).toBe(false);
    expect(chain.match([a, a])).toBe(true);
    expect(chain.match([a, a, a])).toBe(false);

    // aaε∅
    chain = chain.concat(new EmptyRegularExpression());

    expect(chain.match([a, a])).toBe(false);

    // (aaε∅)|εb
    chain = chain.union(
      new ConcatRegularExpression(
        new EpsilonRegularExpression(),
        new LiteralRegularExpression(b),
      ),
    );

    expect(chain.match([a, a])).toBe(false);
    expect(chain.match([b])).toBe(true);
    expect(chain.match([a, b])).toBe(false);
    expect(chain.match([b, b])).toBe(false);
    expect(chain.match([])).toBe(false);

    // ((aaε∅)|εb)*
    chain = chain.star();

    expect(chain.match([a, a])).toBe(false);
    expect(chain.match([b])).toBe(true);
    expect(chain.match([a, b])).toBe(false);
    expect(chain.match([b, b])).toBe(true);
    expect(chain.match([])).toBe(true);

    // ((aaε∅)|εb)*|∅
    chain = chain.union(new EmptyRegularExpression());

    expect(chain.match([a, a])).toBe(false);
    expect(chain.match([b])).toBe(true);
    expect(chain.match([a, b])).toBe(false);
    expect(chain.match([b, b])).toBe(true);
    expect(chain.match([])).toBe(true);
  });

  test('test chain3', () => {
    let chain = chainRegex(new EpsilonRegularExpression());
    chain = chain.concat(
      new StarRegularExpression(new LiteralRegularExpression(a)),
    );
    chain = chain.concat(new LiteralRegularExpression(b));
    chain = chain.concat(new EpsilonRegularExpression());

    expect(chain.regex.toString()).toBe('(((ε(a*))b)ε)');
    expect(chain.match([a])).toBe(false);
    expect(chain.match([a, b])).toBe(true);
    expect(chain.match([a, a, a, a])).toBe(false);
    expect(chain.match([a, a, a, a, a, a, b])).toBe(true);
    expect(chain.match([a, a, a, a, a, a, b, b])).toBe(false);
  });
});
