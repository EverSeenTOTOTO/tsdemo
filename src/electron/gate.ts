/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { IContext, Node, Slot } from '@/graph';
import { UnaryNode, BinaryNode } from '@/graph/nodes';

export class NotGate extends UnaryNode<1 | 0, 1 | 0> {
  emit(input: 'input', value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);
    const result = value === 0 ? 1 : 0;

    connections.forEach((c) => {
      ctx.executor.submit({
        description: `${value} -> ${input} [${this.name}] ${output.name} -> ${result} -> [${c.to.node.name}] ${c.to.name}`,
        action() {
          c.to.node.emit(c.to.name, result, ctx);
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
  handle(input: 'lhs' | 'rhs', value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);
    const result = this.ltemp && this.rtemp;

    connections.forEach((c) => {
      ctx.executor.submit({
        description: `${value} -> ${input} [${this.name}] ${output.name} -> ${result} -> [${c.to.node.name}] ${c.to.name}`,
        action: () => {
          c.to.node.emit(c.to.name, result, ctx);
        },
      });
    });
  }
}

export class OrGate extends BinaryGate {
  handle(input: 'lhs' | 'rhs', value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);
    const result = this.ltemp || this.rtemp;

    connections.forEach((c) => {
      ctx.executor.submit({
        description: `${value} -> ${input} [${this.name}] ${output.name} -> ${result} -> [${c.to.node.name}] ${c.to.name}`,
        action: () => {
          c.to.node.emit(c.to.name, result, ctx);
        },
      });
    });
  }
}

export class XorGate extends BinaryGate {
  handle(input: 'lhs' | 'rhs', value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);
    const result = this.ltemp! + this.rtemp! > 1 ? 0 : this.ltemp! + this.rtemp!;

    connections.forEach((c) => {
      ctx.executor.submit({
        description: `${value} -> ${input} [${this.name}] ${output.name} -> ${result} -> [${c.to.node.name}] ${c.to.name}`,
        action: () => {
          c.to.node.emit(c.to.name, result, ctx);
        },
      });
    });
  }
}

export class AndNotGate extends BinaryGate {
  handle(input: 'lhs' | 'rhs', value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);
    const result = !(this.ltemp && this.rtemp) ? 1 : 0;

    connections.forEach((c) => {
      ctx.executor.submit({
        description: `${value} -> ${input} [${this.name}] ${output.name} -> ${result} -> [${c.to.node.name}] ${c.to.name}`,
        action: () => {
          c.to.node.emit(c.to.name, result, ctx);
        },
      });
    });
  }
}

export class OrNotGate extends BinaryGate {
  handle(input: 'lhs' | 'rhs', value: number, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);
    const result = !(this.ltemp || this.rtemp) ? 1 : 0;

    connections.forEach((c) => {
      ctx.executor.submit({
        description: `${value} -> ${input} [${this.name}] ${output.name} -> ${result} -> [${c.to.node.name}] ${c.to.name}`,
        action: () => {
          c.to.node.emit(c.to.name, result, ctx);
        },
      });
    });
  }
}

// 传输门
export class TGate extends Node<'ctrl' | 'lhs' | 'rhs', 1 | 0, 1 | 0> {
  ctrl = 0;

  value?: ['lhs' | 'rhs', 1 | 0];

  constructor(name: string) {
    super(name);
    this.slots = [
      new Slot('lhs', this),
      new Slot('rhs', this),
      new Slot('ctrl', this),
    ];
  }

  emit(input: 'lhs' | 'rhs' | 'ctrl', value: 1 | 0, ctx: IContext) {
    if (input === 'lhs') this.value = ['lhs', value];
    if (input === 'rhs') this.value = ['rhs', value];
    if (input === 'ctrl') this.ctrl = value;

    if (this.ctrl === 1 && this.value) { // lhs 作为使能端
      const output = this.getSlot(this.value[0] === 'lhs' ? 'rhs' : 'lhs')!; // 双向器件
      const connections = ctx.getConnectionsByFrom(output);
      const result = this.value[1];

      connections.forEach((c) => {
        ctx.executor.submit({
          description: `${value} -> ${input} [${this.name}] ${output.name} -> ${result} -> [${c.to.node.name}] ${c.to.name}`,
          action: () => {
            c.to.node.emit(c.to.name, result, ctx);
          },
        });
      });
    }
  }
}
