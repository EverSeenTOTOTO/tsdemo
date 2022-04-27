/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { Slot, Node, IContext } from './index';

export const LogLevel = {
  info: 1,
  warn: 2,
  error: 3,
};

export type LoggerSlot = keyof typeof LogLevel;

export class LoggerNode extends Node<LoggerSlot, string, never> {
  public level: number;

  constructor(name: string, level = 0) {
    super(name);

    this.level = level;
    this.slots = [
      new Slot('info', this),
      new Slot('warn', this),
      new Slot('error', this),
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  emit(level: LoggerSlot, value: string, _ctx: IContext) {
    if (LogLevel[level] && this.level >= LogLevel[level]) {
      console[level](this.format(level, value));
    }
  }

  setLevel(level: number) {
    this.level = level;
  }

  protected format(level: LoggerSlot, value: string) {
    return `[${level.toUpperCase()} ${new Date().toLocaleTimeString()}]: ${value}`;
  }

  clone() {
    return new LoggerNode(this.name, this.level);
  }
}

export class PipeNode<I, O> extends Node<'input'|'output', I, O> {
  constructor(name: string) {
    super(name);
    this.slots = [
      new Slot('input', this),
      new Slot('output', this),
    ];
  }

  emit(input: 'input', value: I, ctx: IContext) {
    if (input !== 'input') {
      throw new Error('PipeNode can only emit input');
    }

    const output = this.getSlot('output');

    if (output) {
      const connections = ctx.getConnectionsByFrom(output);

      connections.forEach((c) => {
        c.to.node.emit(c.to.name, value, ctx);
      });
    }
  }
}

export class SteppedPipeNode<I, O> extends PipeNode<I, O> {
  emit(input: 'input', value: I, ctx: IContext) {
    if (input !== 'input') {
      throw new Error('PipeNode can only emit input');
    }

    const output = this.getSlot('output');

    if (output) {
      const connections = ctx.getConnectionsByFrom(output);

      connections.forEach((c) => {
        ctx.executor.submit(() => {
          c.to.node.emit(c.to.name, value, ctx);
        });
      });
    }
  }
}
