/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Slot, Node, IContext } from './index';

export class UnaryNode<I, O> extends Node<'input' | 'output', I, O> {
  constructor(name: string) {
    super(name);
    this.slots = [new Slot('input', this), new Slot('output', this)];
  }
}

// for test
export class PipeNode<I, O> extends UnaryNode<I, O> {
  emit(_input: 'input', value: I, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach(c => {
      c.to.node.emit(c.to.name, value, ctx);
    });
  }
}

export class SteppedPipeNode<I, O> extends UnaryNode<I, O> {
  emit(_input: 'input', value: I, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach(c => {
      ctx.executor.submit({
        action() {
          c.to.node.emit(c.to.name, value, ctx);
        },
      });
    });
  }
}

export class BinaryNode<I, O> extends Node<'lhs' | 'rhs' | 'output', I, O> {
  ltemp?: I;

  rtemp?: I;

  constructor(name: string) {
    super(name);
    this.slots = [
      new Slot('lhs', this),
      new Slot('rhs', this),
      new Slot('output', this),
    ];
  }

  emit(input: 'lhs' | 'rhs', value: I, ctx: IContext) {
    if (input === 'lhs') this.ltemp = value;
    if (input === 'rhs') this.rtemp = value;

    this.handle(input, value, ctx);
  }

  handle(_input: 'lhs' | 'rhs', _value: I, _ctx: IContext) {
    throw new Error('Method not implemented');
  }
}

// for test
export function createStore<S extends string, I, O>(
  ctx: IContext,
  name: string,
  slots: S[],
) {
  return new (class StoreNode extends Node<S, I, O> {
    state: Record<S, I> = Object(null);

    record: [S, I][] = [];

    constructor() {
      super(name);
      this.slots = slots.map(s => new Slot(s, this));
      ctx.addNodes(this);
    }

    clear() {
      this.state = Object(null);
      this.record = [];
    }

    emit(slot: S, value: I, _ctx: IContext) {
      this.state[slot] = value;
      this.record.push([slot, value]);
    }
  })();
}
