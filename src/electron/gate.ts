/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IContext } from '@/graph';
import { BinaryNode, UnaryNode } from '@/graph/nodes';

export class NotGate extends UnaryNode<number, number> {
  handle(_input: 'input', value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      ctx.executor.submit({
        action() {
          c.to.node.emit(c.to.name, value === 0 ? 1 : 0, ctx);
        },
      });
    });
  }
}

export class AndGate extends BinaryNode<number, number> {
  handle(_input: 'lhs' | 'rhs', _value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      ctx.executor.submit({
        action: () => {
          c.to.node.emit(c.to.name, this.ltemp && this.rtemp, ctx);
        },
      });
    });
  }
}

export class OrGate extends BinaryNode<number, number> {
  handle(_input: 'lhs' | 'rhs', _value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      ctx.executor.submit({
        action: () => {
          c.to.node.emit(c.to.name, this.ltemp || this.rtemp, ctx);
        },
      });
    });
  }
}

export class XorGate extends BinaryNode<number, number> {
  handle(_input: 'lhs' | 'rhs', _value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      ctx.executor.submit({
        action: () => {
          c.to.node.emit(c.to.name, this.ltemp! + this.rtemp! > 1 ? 0 : this.ltemp! + this.rtemp!, ctx);
        },
      });
    });
  }
}

export class AndNotGate extends BinaryNode<number, number> {
  handle(_input: 'lhs' | 'rhs', _value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      ctx.executor.submit({
        action: () => {
          c.to.node.emit(c.to.name, !(this.ltemp && this.rtemp) ? 1 : 0, ctx);
        },
      });
    });
  }
}

export class OrNotGate extends BinaryNode<number, number> {
  handle(_input: 'lhs' | 'rhs', _value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      ctx.executor.submit({
        action: () => {
          c.to.node.emit(c.to.name, !(this.ltemp || this.rtemp) ? 1 : 0, ctx);
        },
      });
    });
  }
}
