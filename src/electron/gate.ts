/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IContext } from '@/graph';
import { UnaryNode, BinaryNode } from '@/graph/nodes';

export class NotGate extends UnaryNode<1 | 0, 1 | 0> {
  emit(_input: 'input', value: number, ctx: IContext) {
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

class BinaryGate extends BinaryNode<1 | 0, 1 | 0> {
  ltemp: 0 | 1 = 0;

  rtemp: 0 | 1 = 0;
}

export class AndGate extends BinaryGate {
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

export class OrGate extends BinaryGate {
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

export class XorGate extends BinaryGate {
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

export class AndNotGate extends BinaryGate {
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

export class OrNotGate extends BinaryGate {
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
