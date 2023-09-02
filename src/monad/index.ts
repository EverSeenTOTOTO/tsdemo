export class Box<T> {
  value: T;

  private constructor(value: T) {
    this.value = value;
  }

  static of<P>(value: P): Box<P> {
    return new Box(value);
  }

  map<R>(f: (value: T) => R): Box<R> {
    return Box.of(f(this.value));
  }
}

export const map = <T, R>(f: (x: T) => R) => (functor: Box<T>) => functor.map(f);
