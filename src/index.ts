import { init } from 'z3-solver/build/node';

(async function main() {
  const {
    Context,
  } = await init();

  const { Solver, Real } = new Context('main');

  const x = Real.const('x');
  const y = Real.const('y');
  const z = Real.const('z');

  const s = new Solver();

  // https://en.wikipedia.org/wiki/System_of_linear_equations
  s.add(x.mul(3).add(y.mul(2).sub(z)).eq(1));
  s.add(x.mul(2).sub(y.mul(2).sub(z.mul(4))).eq(-2));
  s.add(x.mul(-1).add(y.mul(0.5).sub(z)).eq(0));

  console.log(await s.check());
  console.log(s.model().get(x).value());
  console.log(s.model().get(y).value());
  console.log(s.model().get(z).value());
}());
