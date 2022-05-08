import {
  Executor,
} from '../graph/executor';

class DemoExecutor extends Executor {
  array: number[] = [];

  sync(i: number) {
    this.submit(() => {
      this.array.push(i);
      return () => this.array.pop();
    });
  }

  async(i: number) {
    this.submit(async () => {
      this.array.push(i);
      await new Promise((resolve) => setTimeout(resolve, 0));
      return () => this.array.pop();
    });
  }

  loop(i: number) {
    this.submit(() => {
      this.array.push(i);
      this.loop(i + 1);
      return () => this.array.pop();
    });
  }
}

describe('test graph', () => {
  it('test step and back', async () => {
    const node = new DemoExecutor();

    await node.step();
    await node.next();
    await node.back();
    await node.prev();

    node.sync(1);
    node.async(2);
    node.sync(3);

    await node.step();
    expect(node.array).toEqual([1]);
    await node.step();
    await node.step();
    expect(node.array).toEqual([1, 2, 3]);

    // no effect
    await node.step();
    expect(node.array).toEqual([1, 2, 3]);

    await node.back();
    expect(node.array).toEqual([1, 2]);
    await node.back();
    await node.back();
    expect(node.array).toEqual([]);

    // no effect
    await node.back();
    expect(node.array).toEqual([]);
  });

  it('test next and prev', async () => {
    const node = new DemoExecutor();

    node.async(1);
    node.sync(2);
    node.async(3);

    await node.next();
    expect(node.array).toEqual([1, 2, 3]);

    // no effect
    await node.next();
    expect(node.array).toEqual([1, 2, 3]);

    await node.prev();
    expect(node.array).toEqual([]);

    // no effect
    await node.prev();
    expect(node.array).toEqual([]);
  });

  it('test mixed', async () => {
    const node = new DemoExecutor();

    node.sync(1);
    node.async(2);
    node.sync(3);

    await node.step();
    await node.next();
    expect(node.array).toEqual([1, 2, 3]);

    await node.back();
    await node.prev();
    expect(node.array).toEqual([]);
  });

  it('test mixed2', async () => {
    const node = new DemoExecutor();

    node.sync(1);
    await node.step();
    node.sync(2);
    await node.next();
    node.sync(3);
    await node.back();
    expect(node.array).toEqual([1]);

    await node.next();
    expect(node.array).toEqual([1, 2, 3]);

    await node.back();
    node.sync(4);
    await node.step();
    await node.step();
    await node.back();
    await node.step();
    expect(node.array).toEqual([1, 2, 3, 4]);
  });

  it('test loop', async () => {
    const node = new DemoExecutor();

    node.loop(0);

    for (let i = 0; i < 1000; ++i) {
      await node.step();
    }

    expect(node.array.length).toBe(1000);

    for (let i = 0; i < 999; ++i) {
      await node.back();
    }

    expect(node.array.length).toBe(1);
  });
});