/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Slot, Node, IContext } from './index';

export const LogLevel = {
  info: 1,
  warn: 2,
  error: 3,
};

export type LoggerSlot = keyof typeof LogLevel;

export class LoggerNode extends Node<LoggerSlot, unknown, never> {
  public level: number;

  constructor(name: string, level = LogLevel.info) {
    super(name);

    this.level = level;
    this.slots = [
      new Slot('info', this),
      new Slot('warn', this),
      new Slot('error', this),
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emit(level: LoggerSlot, value: unknown, _ctx: IContext) {
    if (LogLevel[level] && this.level >= LogLevel[level]) {
      console[level](`${this.name}: ${JSON.stringify(value, null, 2)}`);
    }
  }

  setLevel(level: number) {
    this.level = level;
  }

  clone() {
    return new LoggerNode(this.name, this.level);
  }
}

export class UnaryNode<I, O> extends Node<'input' | 'output', I, O> {
  constructor(name: string) {
    super(name);
    this.slots = [
      new Slot('input', this),
      new Slot('output', this),
    ];
  }

  emit(input: 'input', value: I, ctx: IContext) {
    if (input !== 'input') {
      throw new Error('UnaryNode can only emit to "input" slot');
    }

    this.handle(input, value, ctx);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handle(_input: 'input', _value: I, _ctx: IContext) {
    throw new Error('Method not implemented');
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
    if (input !== 'lhs' && input !== 'rhs') {
      throw new Error('BinaryNode can only emit to "lhs" or "rhs" slot');
    }
    if (input === 'lhs') this.ltemp = value;
    if (input === 'rhs') this.rtemp = value;

    if (this.ltemp !== undefined && this.rtemp !== undefined) {
      this.handle(input, value, ctx);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handle(_input: 'lhs' | 'rhs', _value: I, _ctx: IContext) {
    throw new Error('Method not implemented');
  }
}

// for test
export class PipeNode<I, O> extends UnaryNode<I, O> {
  handle(_input: 'input', value: I, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      c.to.node.emit(c.to.name, value, ctx);
    });
  }
}

export class SteppedPipeNode<I, O> extends UnaryNode<I, O> {
  handle(_input: 'input', value: I, ctx: IContext) {
    const output = this.getSlot('output')!;
    const connections = ctx.getConnectionsByFrom(output);

    connections.forEach((c) => {
      ctx.executor.submit({
        action() {
          c.to.node.emit(c.to.name, value, ctx);
        },
      });
    });
  }
}
