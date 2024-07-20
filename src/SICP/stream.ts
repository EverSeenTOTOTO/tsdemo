/* SICP 3.5 */

export const memo = <T>(f: () => T) => {
  let called = false;
  let result: T;
  return () => {
    if (!called) {
      called = true;
      result = f();

      return result;
    }
    return result;
  };
};

export type Stream<T> = [T, () => Stream<T>];

export const stream_cons = <T>(x: T, g: () => Stream<T>): Stream<T> => [
  x,
  memo(g),
];
export const stream_car = <T>(s: Stream<T>) => s[0];
export const stream_cdr = <T>(s: Stream<T>) => s[1]();

export const stream_enumerate_interval = (
  start: number,
  step: number,
): Stream<number> => {
  return stream_cons(start, () => {
    return stream_enumerate_interval(start + step, step);
  });
};

export const stream_filter = <T>(
  s: Stream<T>,
  f: (x: T) => boolean,
): Stream<T> => {
  return f(stream_car(s))
    ? stream_cons(stream_car(s), () => stream_filter(stream_cdr(s), f))
    : stream_filter(stream_cdr(s), f);
};

export const stream_map = <T, U>(s: Stream<T>, f: (x: T) => U): Stream<U> => {
  return stream_cons(f(stream_car(s)), () => stream_map(stream_cdr(s), f));
};

export const stream_join = <T, U = T, R = T>(
  a: Stream<T>,
  b: Stream<U>,
  f: (x: T, y: U) => R,
): Stream<R> => {
  return stream_cons(f(stream_car(a), stream_car(b)), () =>
    stream_join(stream_cdr(a), stream_cdr(b), f),
  );
};

export const stream_reduce = <T, U = T>(
  s: Stream<T>,
  initial: U,
  f: (p: U, c: T) => U,
): Stream<U> => {
  return stream_cons(initial, () =>
    stream_reduce(stream_cdr(s), f(initial, stream_car(s)), f),
  );
};

export const stream_get = <T>(s: Stream<T>, n: number): T => {
  return n <= 0 ? stream_car(s) : stream_get(stream_cdr(s), n - 1);
};

export const stream_foreach = <T>(
  s: Stream<T>,
  f: (x: T) => void,
  n: number,
) => {
  if (n <= -1) return;
  f(stream_car(s));
  stream_foreach(stream_cdr(s), f, n - 1);
};

// 欧拉加速器，适用于交错级数的部分和
export const stream_eular_transform = <T extends number>(
  s: Stream<T>,
): Stream<T> => {
  const s0 = stream_get(s, 0);
  const s1 = stream_get(s, 1);
  const s2 = stream_get(s, 2);
  return stream_cons((s2 - (s2 - s1) ** 2.0 / (s0 + -2.0 * s1 + s2)) as T, () =>
    stream_eular_transform(stream_cdr(s)),
  );
};

// 流的流
export const stream_transform = <T>(
  s: Stream<T>,
  transform: (s: Stream<T>) => Stream<T>,
): Stream<Stream<T>> => {
  return stream_cons(s, () => stream_transform(transform(s), transform));
};

// 交错合并序列
export const stream_interleave = <T>(
  s1: Stream<T>,
  s2: Stream<T>,
): Stream<T> => {
  return stream_cons(stream_car(s1), () => {
    return stream_interleave(s2, stream_cdr(s1));
  });
};
