/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import {
  cons,
  car,
  cdr,
  list_map,
  list_get,
} from '../SICP/lazy';

const list_add = (a: any, b: any): any => {
  return cons(car(a) + car(b), () => list_add(cdr(a), cdr(b)));
};

describe('test lazy', () => {
  it('test implicit', () => {
    const ones: any = cons(1, () => ones);

    expect(car(ones)).toBe(1);
    expect(car(cdr(ones))).toBe(1);
    expect(car(cdr(cdr(ones)))).toBe(1);

    const ints: any = cons(1, () => {
      return list_add(ones, ints);
    });

    expect(car(ints)).toBe(1);
    expect(car(cdr(ints))).toBe(2);
    expect(car(cdr(cdr(ints)))).toBe(3);
  });

  it('test integral', () => {
    const integral = (integrand: any, initial: number, dt: number) => {
      const int: any = cons(initial, () => {
        return list_add(
          list_map(integrand(), (x: number) => x * dt),
          int,
        );
      });

      return int;
    };

    const solve = (f: any, y0: number, dt: number) => {
      const y: any = integral(() => list_map(y, f), y0, dt);

      return y;
    };

    expect(list_get(solve((y: any) => y, 1, 0.001), 5)).toBeGreaterThanOrEqual(1);
  });
});
