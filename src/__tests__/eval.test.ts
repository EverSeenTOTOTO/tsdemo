import * as parse from '@/compile/parse';
import * as ev from '@/compile/eval';
import { Position } from '@/compile/utils';

const factory = (parseMethod: any, evalMethod: any) => (input: string, env = new ev.Env()) => evalMethod(parseMethod(input, new Position()), input, env);

it('evalLit', () => {
  const num = '1.1e4';
  const bool = 'false';
  const str = "'str;\\'str\\''";

  const ep = factory(parse.parseLit, ev.evalLit);

  expect(ep(num)).toBe(1.1e4);
  expect(ep(bool)).toBe(false);
  expect(ep(str)).toBe('str;\'str\'');
});

it('evalBinOp', () => {
  const add = '+ 1 2';
  const sub = '- 1 2';
  const mul = '* 1 2';
  const div = '/ 1 2';
  const lt = '< 1 2';
  const gt = '> 1 2';
  const mod = '% 1 2';
  const eq = '== 1 2';
  const ne = '!= 1 2';
  const concatStr = ".. 'str' 'ing'";
  const concatNum = '.. 4 1';
  const concatNum2 = '.. 1 4';
  const concatArray = '.. [1 2] [3 4]';
  const concatError = '.. 1 [1]';

  const ep = factory(parse.parseBinOpExpr, ev.evalBinOp);

  expect(ep(add)).toBe(3);
  expect(ep(sub)).toBe(-1);
  expect(ep(mul)).toBe(2);
  expect(ep(div)).toBe(0.5);
  expect(ep(lt)).toBe(true);
  expect(ep(gt)).toBe(false);
  expect(ep(mod)).toBe(1);
  expect(ep(eq)).toBe(false);
  expect(ep(ne)).toBe(true);
  expect(ep(concatStr)).toBe('string');
  expect(ep(concatNum)).toEqual([4, 3, 2]);
  expect(ep(concatNum2)).toEqual([1, 2, 3]);
  expect(ep(concatArray)).toEqual([1, 2, 3, 4]);
  expect(() => ep(concatError)).toThrow();
});

it('evalUnOp', () => {
  const notNum = '! 2';
  const notBool = '! false';
  const notObj = '! []';

  const ep = factory(parse.parseUnOpExpr, ev.evalUnOp);

  expect(ep(notNum)).toBe(false);
  expect(ep(notBool)).toBe(true);
  expect(ep(notObj)).toBe(false);
});

it('evalId', () => {
  const parent = new ev.Env();
  const env = new ev.Env(parent);

  env.set('x', 2);
  env.set('y', 'Y');
  env.set('y', 'y');
  parent.set('x', 1);
  parent.set('z', 'z');

  const ep = factory(parse.parseId, ev.evalId);

  expect(ep('x', env)).toBe(2);
  expect(ep('y', env)).toBe('y');
  expect(ep('z', env)).toBe('z');
  expect(() => ep('x')).toThrow();
});

it('evalDot', () => {
  const ep = factory(parse.parseDot, ev.evalDot);
  const obj = { x: 2, y: { z: { x: 1 } } };

  expect(ep('.x')(obj)).toBe(2);
  expect(ep('.y.z.x')(obj)).toBe(1);
  expect(() => ep('.x.y.z')(obj)).toThrow();

  ep('.x')(obj, 3);
  expect(obj.x).toBe(3);

  ep('.y.z')(obj, []);
  expect(obj.y.z).toEqual([]);
});

it('evalExpand', () => {
  const ep = factory(parse.parseExpand, ev.evalExpand);
  const env = new ev.Env();

  ep('[x]', env)([1]);
  expect(env.get('x')).toBe(1);

  ep('[. x]', env)([1, 2]);
  expect(env.get('x')).toBe(2);

  ep('[... x]', env)([1, 2, 3, 4]);
  expect(env.get('x')).toBe(4);

  ep('[... . . x]', env)([1, 2, 3, 4]);
  expect(env.get('x')).toBe(4);

  ep('[... x . .]', env)([1, 2, 3, 4]);
  expect(env.get('x')).toBe(2);

  ep('[... [. x] . .]', env)([1, ['ign', 2], 3, 4]);
  expect(env.get('x')).toBe(2);

  ep('[... [[[[x]]]] . .]', env)([1, [[[[2]]]], 3, 4]);
  expect(env.get('x')).toBe(2);

  ep('[. x . y]', env)([1, 2, 3, 4]);
  expect(env.get('x')).toBe(2);
  expect(env.get('y')).toBe(4);

  ep('[... . . x y]', env)([1, 2, 3, 4]);
  expect(env.get('x')).toBe(3);
  expect(env.get('y')).toBe(4);

  ep('[... x y .]', env)([1, 2, 3, 4, 5]);
  expect(env.get('x')).toBe(3);
  expect(env.get('y')).toBe(4);

  ep('[x . ... y ... . z]', env)([1, 2, 3, 4, 5, 6]);
  expect(env.get('x')).toBe(1);
  expect(env.get('y')).toBe(4);
  expect(env.get('z')).toBe(6);

  ep('[. x . ... y ... . z .]', env)([1, 2, 3, 4, 5, 6, 7]);
  expect(env.get('x')).toBe(2);
  expect(env.get('y')).toBe(4);
  expect(env.get('z')).toBe(6);

  ep('[. x . ... [y] ... [. z .]]', env)([1, 2, 3, [4], [5, 6, 7]]);
  expect(env.get('x')).toBe(2);
  expect(env.get('y')).toBe(4);
  expect(env.get('z')).toBe(6);

  expect(() => ep('[... x]')([])).toThrow();
  expect(() => ep('[. . x]')([1, 2])).toThrow();
  expect(() => ep('[x . .]')([1, 2])).toThrow();
});

it('evalFunc', () => {
  const parent = new ev.Env();
  const env = new ev.Env(parent);

  env.set('x', 2);
  parent.set('z', 4);

  const ep = factory(parse.parseFunc, ev.evalFunc);

  expect(ep('/[] 2')()).toBe(2);
  expect(ep('/[x] x')([2])).toBe(2);
  expect(ep('/[. x] x')([1, 2])).toBe(2);
  expect(ep('/[] [+ z x]', env)()).toBe(6);
  expect(ep('/[] /[] /[] /[y] [+ [+ z x] y]', env)()()()([1])).toBe(7);
});
