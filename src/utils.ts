/* eslint-disable max-classes-per-file */
/* eslint-disable no-extend-native */
export class ExtendMap<K, V> extends Map<K, V> {
  get length() {
    return this.ks().length;
  }

  vs() {
    return [...this.values()];
  }

  ks() {
    return [...this.keys()];
  }

  static None = new ExtendMap<any, any>();
}

export class ExtendSet<T> extends Set<T> {
  get length() {
    return this.vs().length;
  }

  vs() {
    return [...this.values()];
  }

  // get all subsets
  subsets(): ExtendSet<ExtendSet<T>> {
    const values = this.vs();
    const set = new ExtendSet([ExtendSet.None]);

    const helper = (i: number, last: ExtendSet<T>) => {
      for (let x = i; x < values.length; ++x) {
        const current = new ExtendSet([...last.vs(), values[x]]);

        set.add(current);

        helper(x + 1, current);
      }
    };

    helper(0, new ExtendSet());

    return new ExtendSet<ExtendSet<T>>(set.vs().sort((a, b) => a.vs().length - b.vs().length));
  }

  addMultiple(items: ExtendSet<T>): void;
  addMultiple(items: T[]): void;
  addMultiple(...items: T[]): void;
  addMultiple(items: any): void {
    for (const item of items) {
      this.add(item);
    }
  }

  static None: ExtendSet<any> = new ExtendSet();

  static isSame<P>(a: ExtendSet<P>, b: ExtendSet<P>) {
    for (const item of a) {
      if (!b.has(item)) {
        return false;
      }
    }

    for (const item of b) {
      if (!a.has(item)) {
        return false;
      }
    }

    return true;
  }

  static union<P>(...sets: ExtendSet<P>[]) {
    return new ExtendSet<P>(sets.map((s) => s.vs()).reduce((prev, curr) => [...prev, ...curr], []));
  }
}

export class ExtendArray<T> extends Array<T> {
  top() {
    return this[this.length - 1];
  }

  bottom() {
    return this[0];
  }

  head() {
    return this.bottom();
  }

  tail() {
    return this.top();
  }

  static isSame<P>(a: ExtendArray<P>, b: ExtendArray<P>) {
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }

    return true;
  }
}

export const repeat = <T>(x: T, length: number): T[] => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  // eslint-disable-next-line prefer-spread
  return Array.apply(null, { length }).map(() => x);
};

export const flattern = (arr: any[]): any[] => {
  return arr.reduce((prev, curr) => [
    ...prev,
    ...Array.isArray(curr) ? flattern(curr) : [curr],
  ], []);
};

export const call = async <T extends (...args: Param[]) => any, Param>(fn: T, ...param: Param[]) => {
  if (typeof fn !== 'function') return Promise.resolve(fn);

  // eslint-disable-next-line no-nested-ternary
  return toString.call(fn) === '[object AsyncFunction]'
    ? Promise.resolve(fn(...param))
    : fn(...param);
};
