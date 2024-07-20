import {
  Term,
  Var,
  Const,
  isConst,
  isEqual,
  eliminateVariables,
  unify,
} from '../unify';

it('test isEqual', () => {
  expect(isEqual(new Const(42), new Const(42))).toBe(true);
  expect(isEqual(new Var('foo'), new Var('foo'))).toBe(true);
  expect(isEqual(new Term([]), new Term([]))).toBe(true);
  expect(
    isEqual(
      new Term([new Const(42), new Var('foo')]),
      new Term([new Const(42), new Var('foo')]),
    ),
  ).toBe(true);
  expect(
    isEqual(
      new Term([new Const(42), new Var('foo')]),
      new Term([new Var('foo'), new Const(42)]),
    ),
  ).toBe(false);
});

it('test term resolveWith', () => {
  const term = new Term([
    new Term([new Const(42), new Var('foo')]),
    new Var('foo'),
  ]);

  term.resolveWith(new Var('foo'), new Const(42));

  expect(
    isEqual(
      term,
      new Term([new Term([new Const(42), new Const(42)]), new Const(42)]),
    ),
  ).toBe(true);
});

it('test isConst', () => {
  expect(isConst(new Const(42))).toBe(true);
  expect(isConst(new Var('foo'))).toBe(false);
  expect(isConst(new Term([]))).toBe(true);
  expect(isConst(new Term([new Const(42)]))).toBe(true);
  expect(isConst(new Term([new Var('foo')]))).toBe(false);
  expect(isConst(new Term([new Term([new Const(42), new Var('foo')])]))).toBe(
    false,
  );
});

it('test eliminateVariables', () => {
  expect(
    isEqual(
      eliminateVariables(new Var('foo'), new Map([['foo', new Const(42)]])),
      new Const(42),
    ),
  ).toBe(true);
  expect(
    isEqual(
      eliminateVariables(new Var('foo'), new Map([['bar', new Const(42)]])),
      new Var('foo'),
    ),
  ).toBe(true);
  expect(
    isEqual(
      eliminateVariables(new Var('foo'), new Map([['foo', new Var('bar')]])),
      new Var('bar'),
    ),
  ).toBe(true);
  expect(
    isEqual(
      eliminateVariables(
        new Term([new Const(42), new Var('foo'), new Var('bar')]),
        new Map([['foo', new Const(42)]]),
      ),
      new Term([new Const(42), new Const(42), new Var('bar')]),
    ),
  ).toBe(true);
});

it('test unify c c', () => {
  expect(isEqual(unify(new Const(42), new Const(42))!, new Const(42)));
  expect(() => unify(new Const(42), new Const(24))).toThrow();
});

it('test unify c v', () => {
  const dict = new Map();

  expect(isEqual(unify(new Var('foo'), new Const(42), dict)!, new Const(42)));
  expect(isEqual(dict.get('foo'), new Const(42))).toBe(true);
});

it('test unify c t', () => {
  expect(() => unify(new Const(42), new Term([]))).toThrow();
});

it('test unify v v', () => {
  const dict = new Map();
  expect(isEqual(unify(new Var('foo'), new Var('bar'), dict)!, new Var('bar')));
  expect(isEqual(dict.get('foo'), new Var('bar'))).toBe(true);
});

it('test unify v t', () => {
  const dict = new Map();
  expect(isEqual(unify(new Var('foo'), new Term([]), dict)!, new Term([])));
  expect(isEqual(dict.get('foo'), new Term([]))).toBe(true);
  expect(() => unify(new Var('foo'), new Term([new Var('foo')]))).toThrow();
});

it('test unify c v dict_c', () => {
  const dict = new Map([['foo', new Const(42)]]);
  expect(() => unify(new Var('foo'), new Const(24), dict)).toThrow();
});

it('test unify c v dict_v', () => {
  const dict = new Map([['foo', new Var('bar')]]);

  unify(new Var('foo'), new Const(42), dict);

  expect(isEqual(dict.get('foo')!, new Const(42))).toBe(true);
  expect(isEqual(dict.get('bar')!, new Const(42))).toBe(true);
});

it('test unify c v dict_v', () => {
  const dict = new Map([['foo', new Var('bar')]]);

  unify(new Var('bar'), new Const(42), dict);

  expect(isEqual(dict.get('foo')!, new Const(42))).toBe(true);
  expect(isEqual(dict.get('bar')!, new Const(42))).toBe(true);
});

it('test unify c v dict_t', () => {
  const dict = new Map([['foo', new Term([new Var('bar')])]]);

  unify(new Var('bar'), new Const(42), dict);

  expect(isEqual(dict.get('foo')!, new Term([new Const(42)]))).toBe(true);
  expect(isEqual(dict.get('bar')!, new Const(42))).toBe(true);
});

it('test unify c v dict_t', () => {
  const dict = new Map([['foo', new Term([new Var('bar')])]]);

  unify(new Var('foo'), new Term([new Const(42)]), dict);

  expect(isEqual(dict.get('foo')!, new Term([new Const(42)]))).toBe(true);
  expect(isEqual(dict.get('bar')!, new Const(42))).toBe(true);
});

it('test unify v v dict_c', () => {
  const dict = new Map([['foo', new Const(42)]]);

  unify(new Var('bar'), new Var('foo'), dict);

  expect(isEqual(dict.get('foo')!, new Const(42))).toBe(true);
  expect(isEqual(dict.get('bar')!, new Const(42))).toBe(true);
});

it('test unify v v dict_c', () => {
  const dict = new Map([['foo', new Const(42)]]);

  unify(new Var('foo'), new Var('bar'), dict);

  expect(isEqual(dict.get('foo')!, new Const(42))).toBe(true);
  expect(isEqual(dict.get('bar')!, new Const(42))).toBe(true);
});

it('test unify recursive', () => {
  const dict = new Map();

  unify(new Var('a'), new Var('b'), dict);
  unify(new Var('b'), new Var('c'), dict);
  unify(new Var('c'), new Var('a'), dict);

  expect(isEqual(dict.get('a')!, new Var('b')));
  expect(isEqual(dict.get('b')!, new Var('c')));
});

it('test unify recursive', () => {
  const dict = new Map([['foo', new Term([new Var('bar')])]]);

  expect(() => unify(new Var('bar'), new Var('foo'), dict)).toThrow();
});

it('test unify temp', () => {
  const dict = new Map();

  unify(new Var('a'), new Term([new Var('b'), new Var('c')]), dict);
  unify(
    new Term([new Var('b'), new Const(42)]),
    new Term([new Const(24), new Var('c')]),
    dict,
  );

  expect(
    isEqual(dict.get('a')!, new Term([new Const(24), new Const(42)])),
  ).toBe(true);
  expect(isEqual(dict.get('b')!, new Const(24))).toBe(true);
  expect(isEqual(dict.get('c')!, new Const(42))).toBe(true);
});
