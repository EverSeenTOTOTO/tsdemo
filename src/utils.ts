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
}

export class ExtendSet<T> extends Set<T> {
  get length() {
    return this.vs().length;
  }

  vs() {
    return [...this.values()];
  }

  addMultiple(items: ExtendSet<T>): void;
  addMultiple(items: T[]): void;
  addMultiple(...items: T[]): void;
  addMultiple(items: any): void {
    for (const item of items) {
      this.add(item);
    }
  }

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
