import { Executor } from '@/graph/executor';
import {
  LogLevel,
  PipeNode,
  LoggerNode,
  SteppedPipeNode,
} from '@/graph/nodes';
import { Node, Context, Slot } from '@/graph/index';
import { ExtendArray } from '@/utils';

describe('test basic', () => {
  const executor = new Executor();
  const ctx = new Context(executor);

  it('test maxConnection', () => {
    const n1 = new Node('n1');
    const n2 = new Node('n2');

    n1.addSlot(new Slot('n1', n1, 1));
    n2.addSlot(new Slot('n2', n2));

    ctx.addNode(n1);
    ctx.addNode(n2);

    expect(() => ctx.connect(n1, 'not exist', n2, 'n2')).toThrow(/no slot/);
    expect(() => ctx.connect(n1, 'n1', n2, 'not exist')).toThrow(/no slot/);

    ctx.connect(n1, 'n1', n2, 'n2');
    expect(() => ctx.connect(n1, 'n1', n2, 'n2')).toThrow(/max/);
  });
});

describe('test clone', () => {
  it('clone node', () => {
    const node = new LoggerNode('test', LogLevel.warn);
    const clone = node.clone();

    expect(clone).toBeInstanceOf(LoggerNode);
    expect(clone.name).toBe('test');

    clone.setLevel(LogLevel.info);

    expect(node.level).toBe(LogLevel.warn);
  });

  it('clone ctx', () => {
    const executor = new Executor();
    const ctx = new Context(executor);
    const pipe = new PipeNode('pipe');
    const log = new LoggerNode('log', LogLevel.info);

    ctx.addNode(pipe);
    ctx.addNode(log);

    ctx.connect(pipe, 'output', log, 'info');

    const clone = ctx.clone();
    expect(clone.connections.length).toBe(ctx.connections.length);

    const info = jest.spyOn(console, 'info').mockImplementation(() => {});

    clone.emit(pipe, 'input', 'test');
    expect(info).not.toHaveBeenCalled();

    ctx.emit(pipe, 'input', 'test');
    expect(info).toHaveBeenCalled();
  });
});

describe('test nodes', () => {
  it('test no step', () => {
    const executor = new Executor();
    const ctx = new Context(executor);

    const pipe = new PipeNode('pipe');
    const pipe2 = new PipeNode('pipe2');
    const log = new LoggerNode('log', LogLevel.info);

    ctx.addNode(pipe);
    ctx.addNode(pipe2);
    ctx.addNode(log);

    ctx.connect(pipe, 'output', log, 'info');
    ctx.connect(pipe, 'output', pipe2, 'input');
    ctx.connect(pipe2, 'output', log, 'error');

    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    ctx.emit(pipe, 'input', 'hello');

    expect(info).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();

    log.setLevel(LogLevel.error);

    ctx.emit(pipe, 'input', 'hello');
    expect(info).toHaveBeenCalledTimes(2);
    expect(error).toHaveBeenCalled();
  });

  it('test step', async () => {
    const executor = new Executor();
    const ctx = new Context(executor);

    const pipe = new SteppedPipeNode('pipe');
    const pipe2 = new SteppedPipeNode('pipe2');
    const log = new LoggerNode('log', LogLevel.error);

    ctx.addNode(pipe);
    ctx.addNode(pipe2);
    ctx.addNode(log);

    ctx.connect(pipe, 'output', log, 'info');
    ctx.connect(pipe, 'output', pipe2, 'input');
    ctx.connect(pipe2, 'output', log, 'error');

    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    ctx.emit(pipe, 'input', 'hello');

    expect(info).not.toHaveBeenCalled();

    await ctx.step();
    expect(info).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    await ctx.step();
    expect(error).not.toHaveBeenCalled();
    await ctx.step();
    expect(error).toHaveBeenCalled();
  });

  it('test next', async () => {
    const executor = new Executor();
    const ctx = new Context(executor);

    const pipe = new SteppedPipeNode('pipe');
    const pipe2 = new SteppedPipeNode('pipe2');
    const log = new LoggerNode('log', LogLevel.error);

    ctx.addNode(pipe);
    ctx.addNode(pipe2);
    ctx.addNode(log);

    ctx.connect(pipe, 'output', log, 'info');
    ctx.connect(pipe, 'output', pipe2, 'input');
    ctx.connect(pipe2, 'output', log, 'error');

    const error = jest.spyOn(console, 'error').mockImplementation(() => {});

    ctx.emit(pipe, 'input', 'hello');

    await ctx.next();
    expect(error).not.toHaveBeenCalled();
    await ctx.next();
    expect(error).toHaveBeenCalled();
  });
});

describe('test back', () => {
  class TestNode extends Node<'value', number, void> {
    array: ExtendArray<number> = new ExtendArray<number>();

    constructor(name: string) {
      super(name);
      this.slots = [
        new Slot('value', this),
      ];
    }

    emit(_slot: 'value', value: number, ctx: Context): void {
      ctx.executor.submit({
        desc: `Push ${value}`,
        func: () => {
          this.array.push(value);

          return { // undo
            desc: `Pop ${value}`,
            func: () => {
              if (this.array.tail() !== value) {
                throw new Error(`Cannot pop back, tail is ${this.array.tail()}`);
              }

              this.array.pop();
            },
          };
        },
      });
    }
  }

  it('test back', async () => {
    const executor = new Executor();
    const ctx = new Context(executor);

    const pipe = new PipeNode('pipe');
    const test = new TestNode('test');

    ctx.addNode(pipe);
    ctx.addNode(test);

    ctx.connect(pipe, 'output', test, 'value');

    ctx.emit(pipe, 'input', 1);
    ctx.emit(pipe, 'input', 2);

    expect([...test.array]).toEqual([]);

    await ctx.next();
    expect([...test.array]).toEqual([1, 2]);

    ctx.emit(pipe, 'input', 3);

    await ctx.step();
    expect([...test.array]).toEqual([1, 2, 3]);
    await ctx.back();
    expect([...test.array]).toEqual([1, 2]);
    await ctx.back();
    expect([...test.array]).toEqual([1]);
    await ctx.step();
    expect([...test.array]).toEqual([1, 2]);
    await ctx.prev();
    expect([...test.array]).toEqual([]);
    await ctx.next();
    expect([...test.array]).toEqual([1, 2, 3]);
  });
});
