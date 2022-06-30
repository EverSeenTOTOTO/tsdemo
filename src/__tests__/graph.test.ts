import { Executor } from '@/graph/executor';
import {
  LogLevel,
  PipeNode,
  LoggerNode,
  SteppedPipeNode,
} from '@/graph/nodes';
import { Node, Context, Slot } from '@/graph/index';
import { repeat } from '@/utils';

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

    const info = jest.spyOn(console, 'info').mockImplementation(() => { });

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

    const info = jest.spyOn(console, 'info').mockImplementation(() => { });
    const error = jest.spyOn(console, 'error').mockImplementation(() => { });

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

    const info = jest.spyOn(console, 'info').mockImplementation(() => { });
    const error = jest.spyOn(console, 'error').mockImplementation(() => { });

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

    const error = jest.spyOn(console, 'error').mockImplementation(() => { });

    ctx.emit(pipe, 'input', 'hello');

    await ctx.next();
    expect(error).not.toHaveBeenCalled();
    await ctx.next();
    expect(error).toHaveBeenCalled();
  });
});

class StateNode<O> extends Node<'i' | 'o1' | 'o2', string[], O> {
  pattern: RegExp;

  constructor(name: string, pattern: RegExp) {
    super(name);
    this.pattern = pattern;
    this.slots = [
      new Slot('i', this),
      new Slot('o1', this),
      new Slot('o2', this),
    ];
  }

  emit(_input: 'i', value: string[], ctx: Context) {
    if (value.length === 0) return;

    const match = this.pattern.exec(value[0]);
    // eslint-disable-next-line no-nested-ternary
    const slot = this.getSlot(match?.groups?.o1 ? 'o1' : match?.groups?.o2 ? 'o2' : 'none');

    if (slot) {
      const connections = ctx.getConnectionsByFrom(slot);

      value.splice(0, 1);

      connections.forEach((c) => {
        ctx.executor.submit({
          action: () => {
            c.to.node.emit(c.to.name, value, ctx);
          },
        });
      });
    }
  }
}

it('test run', async () => {
  const executor = new Executor();
  const ctx = new Context(executor);

  const a = new StateNode('a', /(?<o1>a)/);
  const c = new StateNode('c', /(?<o1>a)|(?<o2>b)/);
  const log = new LoggerNode('log', LogLevel.error);

  ctx.connect(a, 'o1', c, 'i');
  ctx.connect(c, 'o1', a, 'i');
  ctx.connect(c, 'o2', log, 'info');

  const input = [...repeat('a', 100), 'a', 'b'];

  ctx.emit(a, 'input', input);

  await ctx.run();

  expect(input).toEqual([]);
});
