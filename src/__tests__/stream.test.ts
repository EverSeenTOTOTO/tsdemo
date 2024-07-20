import {
  Stream,
  stream_car,
  stream_cdr,
  stream_get,
  stream_map,
  stream_cons,
  stream_join,
  stream_filter,
  stream_reduce,
  stream_foreach,
  stream_transform,
  stream_interleave,
  stream_eular_transform,
  stream_enumerate_interval,
} from '../SICP/stream';

const stream_add = (s1: Stream<number>, s2: Stream<number>) =>
  stream_join(s1, s2, (x, y) => x + y);
const partial_sum = (s: Stream<number>): Stream<number> => {
  return stream_reduce(stream_cdr(s), stream_car(s), (p, c) => p + c);
};

describe('test stream', () => {
  it('test construct', () => {
    const ints = (i: number): Stream<number> =>
      stream_cons(i, () => {
        return ints(i + 1);
      });
    const s = ints(0);

    expect(stream_car(s)).toBe(0);
    expect(stream_car(stream_cdr(stream_cdr(s)))).toBe(2);
  });

  it('test stream_enumerate_interval', () => {
    const s = stream_enumerate_interval(1, 2);
    const s1 = stream_cdr(s);
    const s2 = stream_cdr(s1);
    expect(stream_car(s2)).toBe(5);
  });

  it('test stream operator', () => {
    const s = stream_enumerate_interval(1, 1);
    const even = stream_filter(s, x => x % 2 === 0);

    expect(stream_get(even, 0)).toBe(2);
    expect(stream_get(even, 999)).toBe(2000);

    const square = stream_map(even, x => x ** 2);

    expect(stream_get(square, 0)).toBe(4);
    expect(stream_get(square, 99)).toBe(40000);
  });

  it('implicit stream', () => {
    const ones: Stream<number> = stream_cons(1, () => ones);

    expect(stream_car(ones)).toBe(1);
    expect(stream_get(ones, 1000)).toBe(1);

    const ints: Stream<number> = stream_cons(1, () => {
      return stream_add(ones, ints);
    });

    expect(stream_car(ints)).toBe(1);
    expect(stream_get(ints, 1000)).toBe(1001);

    const sums = partial_sum(ints);

    expect(stream_get(sums, 3)).toBe(10);
    expect(stream_get(sums, 4)).toBe(15);

    const fibs: Stream<number> = stream_cons(0, () =>
      stream_cons(1, () => {
        return stream_add(fibs, stream_cdr(fibs));
      }),
    );

    expect(stream_get(fibs, 3)).toBe(2);
    expect(stream_get(fibs, 10)).toBe(55);
  });

  it('stream sqrt', () => {
    const sqrt_improve = (guess: number, x: number) => {
      return (guess + x / guess) / 2;
    };
    const sqrt_stream = (x: number): Stream<number> => {
      return stream_cons(1.0, () => {
        return stream_map(sqrt_stream(x), guess => sqrt_improve(guess, x));
      });
    };

    const s = sqrt_stream(2);
    expect(stream_get(s, 1)).toBe(1.5);
    expect(Math.abs(stream_get(s, 100) - Math.sqrt(2))).toBeLessThan(0.00001);
  });

  it('stream pi', () => {
    const pi_item = (n: number): Stream<number> => {
      return stream_cons(1.0 / n, () => {
        return stream_map(pi_item(n + 2.0), (x: number) => -x);
      });
    };

    const pi = stream_map(partial_sum(pi_item(1)), (x: number) => x * 4);
    const pi2 = stream_eular_transform(pi);

    const pit = stream_transform(pi, stream_eular_transform);

    expect(stream_car(pit)).toBe(pi);

    // will be NaN if too small
    const pi3 = stream_map(pit, stream_car);

    const getX = (s: Stream<number>) => Math.abs(stream_get(s, 5) - Math.PI);
    const x = getX(pi);
    const y = getX(pi2);
    const z = getX(pi3);

    expect(x).toBeGreaterThan(y);
    expect(y).toBeGreaterThan(z);
  });

  it('stream interleave', () => {
    const ones: Stream<number> = stream_cons(1, () => ones);
    const zeros: Stream<number> = stream_cons(0, () => zeros);

    const s = stream_interleave(ones, zeros);

    const arr: number[] = [];
    stream_foreach(s, x => arr.push(x), 4);

    expect(arr).toEqual([1, 0, 1, 0, 1]);
  });

  it('stream signal', () => {
    const integral = (
      integrand: Stream<number>,
      initial: number,
      dt: number,
    ) => {
      const int: Stream<number> = stream_cons(initial, () => {
        return stream_add(
          stream_map(integrand, x => x * dt),
          int,
        );
      });

      return int;
    };

    const RC = (R: number, C: number, dt: number) => {
      return (I: Stream<number>, v0: number): Stream<number> =>
        stream_add(
          stream_map(I, x => x * R),
          integral(
            stream_map(I, x => x / C),
            v0,
            dt,
          ),
        );
    };

    const make_rc = RC(5, 1, 0.1);
    const I: Stream<number> = stream_cons(1, () => I);
    const v = make_rc(I, 1);

    // 充电
    expect(stream_get(v, 4)).toBeGreaterThan(stream_get(v, 2));
  });

  // 积分器
  const intergral = (
    delayedIntergrand: () => Stream<number>,
    initial: number,
    dt: number,
  ) => {
    const int: Stream<number> = stream_cons(initial, () => {
      return stream_add(
        stream_map(delayedIntergrand(), x => x * dt),
        int,
      );
    });

    return int;
  };

  it('stream signal delay', () => {
    // dy/dt = f
    const solve = (f: (x: number) => number, y0: number, dt: number) => {
      const y: Stream<number> = intergral(() => stream_map(y, f), y0, dt);

      return y;
    };

    expect(
      Math.abs(
        stream_get(
          solve(y => y, 1, 0.001),
          1000,
        ) - Math.E,
      ),
    ).toBeLessThan(0.01);

    // 一阶RC电路
    const RC = (R: number, C: number, q0: number, v0: number, dt: number) =>
      solve(Q => v0 / R - Q / (R * C), q0, dt);
    const C = 1;
    const v0 = 1;
    const s1 = RC(5, C, 0, v0, 0.1);
    const s2 = RC(5, C, 10, v0, 0.1);

    console.log(stream_get(s1, 0));
    console.log(stream_get(s1, 10));
    console.log(stream_get(s1, 100));
    console.log(stream_get(s1, 1000));
    console.log(stream_get(s1, 2000));
    console.log(stream_get(s2, 0));
    console.log(stream_get(s2, 10));
    console.log(stream_get(s2, 100));
    console.log(stream_get(s2, 1000));
    console.log(stream_get(s2, 2000));

    // 一阶RC电路电容稳定于于Cv0
    expect(Math.abs(stream_get(s1, 2000) - C * v0)).toBeLessThan(0.001);
    expect(Math.abs(stream_get(s2, 2000) - C * v0)).toBeLessThan(0.001);

    // 简单种群逻辑斯蒂方程
    const N = (r: number, n0: number, K: number, dt: number) =>
      solve((n: number) => r * n * (1 - n / K), n0, dt);
    const K = 50;
    const s = N(2, 10, K, 0.01);

    // 不动点K
    expect(Math.abs(stream_get(s, 2000) - 50)).toBeLessThan(0.001);
  });

  it('stream signal delay2', () => {
    const solve = (
      f: (dy: number, y: number) => number,
      dy0: number,
      y0: number,
      dt: number,
    ) => {
      const y = intergral(
        () => {
          const dy = intergral(
            () => {
              return stream_map(dy, x => f(x, stream_car(y)));
            },
            dy0,
            dt,
          );

          return stream_map(y, x => f(stream_car(dy), x));
        },
        y0,
        dt,
      );

      return y;
    };

    const s = solve((dy, y) => y + dy, 0.001, 1, 0.001);

    console.log(stream_get(s, 1000));
  });
});
