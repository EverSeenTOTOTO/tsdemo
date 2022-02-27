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

  es() {
    return [...this.entries()];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addMultiple(items: any): void {
    for (const item of items) {
      this.add(item);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
