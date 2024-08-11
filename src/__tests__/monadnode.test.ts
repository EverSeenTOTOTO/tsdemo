import { uuid } from '@/utils';
import { Context, Node, Slot } from '@/monad/node';

it('test graph op', async () => {
  const fn = jest.fn();

  class TestNode extends Node {
    constructor(id: string) {
      super(id);

      this.defineSlot(new Slot('slot'));
    }

    get slot() {
      return this.slots.get('slot')!;
    }

    async onExecute(_ctx: Context) {
      fn(this.id);
    }
  }

  class TestContext extends Context {
    async run(start: Node) {
      const executed = new WeakSet<Node>();
      const queue = [start];

      while (queue.length > 0) {
        const top = queue.shift()!;

        await top.onExecute(this);
        executed.add(top);

        top.slots.forEach(slot => {
          this.getEdges(slot).forEach(edge => {
            const to = this.getNode(edge.to);

            if (to && !executed.has(to)) {
              queue.push(to);
            }
          });
        });
      }
    }
  }

  const a = new TestNode('a');
  const b = new TestNode('b');
  const c = new TestNode('c');

  const ctx = new TestContext();

  ctx.addNode(a).addNode(b);

  expect(ctx.getNode(a.id)).toBe(a);
  expect(ctx.getNode(c.id)).toBeUndefined();

  ctx.addNode(c);
  expect(ctx.nodeCount).toBe(3);

  ctx.connect(uuid(), a.slot, b.slot);
  ctx.connect(uuid(), b.slot, c.slot);
  ctx.connect(uuid(), c.slot, a.slot);

  expect(ctx.edgeCount).toBe(3);
  expect(ctx.getNode(a.slot)).toBe(a);
  expect(ctx.getEdges(a.slot).size).toBe(2);

  await ctx.run(a);

  expect(fn).toHaveBeenNthCalledWith(1, 'a');
  expect(fn).toHaveBeenNthCalledWith(2, 'b');
  expect(fn).toHaveBeenNthCalledWith(3, 'c');
});
