import { List, Pending } from '../monad';

const a = new List([1, 2, 3]);
const b = new List([1, 2, 3]);
const c = new List([2, 3, 4]);

it('Setoid', () => {
  expect(a.equals(b)).toBe(true);
  expect(a.equals(b)).toBe(b.equals(a));
});

it('Semigroup', () => {
  expect(
    a
      .concat(b)
      .concat(c)
      .equals(a.concat(b.concat(c))),
  ).toBe(true);
});

it('Monoid', () => {
  expect(a.concat(List.empty()).equals(a)).toBe(true);
  expect(List.empty().concat(a).equals(a)).toBe(true);
});

const id = <T>(value: T): T => value;
const f = (value: number) => value + 1;
const g = (value: number) => value * 2;

it('Functor', () => {
  expect(a.map(id).equals(a)).toBe(true);
  expect(a.map(x => f(g(x))).equals(a.map(g).map(f))).toBe(true);
});

const F = new List([f, g]);
const G = new List([
  (value: number) => value % 2 === 0,
  (value: number) => value % 3 === 0,
]);

it('Apply', () => {
  expect(
    a
      .ap(F)
      .ap(G)
      .equals(a.ap(F.ap(G.map(gn => fn => n => gn(fn(n)))))),
  ).toBe(true);
});

it('Applicative', () => {
  expect(a.ap(List.of(id)).equals(a)).toBe(true);
  expect(
    List.of(42)
      .ap(List.of(f))
      .equals(List.of(f(42))),
  );
  expect(
    List.of(42)
      .ap(F)
      .equals(F.ap(List.of(fn => fn(42)))),
  );
});

it('Foldable', () => {
  const fn = (acc: number, x: number) => acc + x;

  expect(a.reduce(fn, 0)).toBe(
    a
      .reduce(
        (acc: List<number>, x: number) => acc.concat(List.of(x)),
        List.empty(),
      )
      .reduce(fn, 0),
  );
});

const fn = (x: number) => List.of(f(x));
const gn = (x: number) => List.of(g(x));

it('Chain', () => {
  expect(
    a
      .chain(fn)
      .chain(gn)
      .equals(a.chain(x => fn(x).chain(gn))),
  ).toBe(true);
});

it('Monad', () => {
  expect(List.of(42).chain(fn).equals(fn(42))).toBe(true);
  expect(a.chain(List.of).equals(a)).toBe(true);
});

const pa = new Pending<number>(cb => cb(42));

it('Promise Setoid', done => {
  pa.equals(pa).run(value => {
    expect(value).toBe(true);
    done();
  });
});

it('Promise Functor Identity', done => {
  pa.map(id)
    .equals(pa)
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

it('Promise Functor Composition', done => {
  pa.map(x => f(g(x)))
    .equals(pa.map(g).map(f))
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

const PF = new Pending<(_value: number) => number>(cb => cb(f));
const PG = new Pending<(_value: number) => number>(cb => cb(g));

it('Promise Apply', done => {
  pa.ap(PF)
    .ap(PG)
    .equals(pa.ap(PF.ap(PG.map(gn1 => fn1 => n => gn1(fn1(n))))))
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

it('Promise Applicative Identity', done => {
  pa.ap(Pending.of(id))
    .equals(pa)
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

it('Promise Applicative Homomorphism', done => {
  Pending.of(42)
    .ap(Pending.of(f))
    .equals(Pending.of(f(42)))
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

it('Promise Applicative Interchange', done => {
  Pending.of(42)
    .ap(PF)
    .equals(PF.ap(Pending.of(fn1 => fn1(42))))
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

const pfn = (x: number) => Pending.of(f(x));
const pgn = (x: number) => Pending.of(g(x));

it('Promise Chain', done => {
  pa.chain(pfn)
    .chain(pgn)
    .equals(pa.chain(x => pfn(x).chain(pgn)))
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

it('Promise Monad Left Identity', done => {
  Pending.of(42)
    .chain(pfn)
    .equals(pfn(42))
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});

it('Promise Monad Right Identity', done => {
  pa.chain(Pending.of)
    .equals(pa)
    .run(value => {
      expect(value).toBe(true);
      done();
    });
});
