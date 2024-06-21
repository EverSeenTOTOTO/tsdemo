export class List<T> {
  value: T[];

  constructor(value: T[]) {
    this.value = value;
  }

  equals(other: List<T>): boolean {
    for (let i = 0; i < this.value.length; i++) {
      if (this.value[i] !== other.value[i]) {
        return false;
      }
    }
    return true;
  }

  concat(other: List<T>): List<T> {
    return new List(this.value.concat(other.value));
  }

  static of<P>(value: P): List<P> {
    return new List([value]);
  }

  static empty<P = any>(): List<P> {
    return new List([]);
  }

  map<R>(f: (value: T) => R): List<R> {
    return new List(this.value.map(f));
  }

  ap<R>(functor: List<(value: T) => R>) {
    return this.value.reduce((acc, value) => {
      return functor.value.reduce((r, f) => {
        return r.concat(List.of(f(value)));
      }, acc);
    }, List.empty<R>());
  }

  reduce<R>(f: (acc: R, value: T) => R, init: R) {
    return this.value.reduce(f, init);
  }

  chain<R>(f: (value: T) => List<R>): List<R> {
    return this.value.reduce((acc, value) => {
      return acc.concat(f(value));
    }, List.empty<R>());
  }
}

export class Pending<T> {
  private task: (cb: (value: T) => void) => void;

  constructor(task: Pending<T>['task']) {
    this.task = task;
  }

  map<R>(f: (value: T) => R) {
    return new Pending<R>((cb) => {
      this.task((value) => {
        cb(f(value));
      });
    });
  }

  ap<R>(functor: Pending<(value: T) => R>) {
    return new Pending<R>((cb) => {
      this.task((value) => {
        functor.task((fnValue) => {
          cb(fnValue(value));
        });
      });
    });
  }

  chain<R>(f: (value: T) => Pending<R>) {
    return new Pending<R>((cb) => {
      this.task((value) => {
        f(value).task(cb);
      });
    });
  }

  static of<R>(value: R) {
    return new Pending<R>((cb) => cb(value));
  }

  equals(other: Pending<T>) {
    return new Pending<boolean>((cb) => {
      this.task((lhs) => other.task((rhs) => cb(lhs === rhs)));
    });
  }

  run(cb: (value: T) => void) {
    return this.task(cb);
  }

  then<R>(done: (value: T) => R): R extends Pending<unknown> ? R : Pending<R> {
    return this.map(done).chain((value) => (value instanceof Pending ? value : Pending.of(value))) as any;
  }
}
