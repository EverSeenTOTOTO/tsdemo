import { Executor } from '@/graph/executor';
import {
  LogLevel,
  PipeNode,
  LoggerNode,
  SteppedPipeNode,
} from '@/graph/nodes';
import { Context } from '@/graph/index';

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

    pipe.emit('input', 'test', clone);
    expect(info).not.toHaveBeenCalled();

    pipe.emit('input', 'test', ctx);
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

    pipe.emit('input', 'hello', ctx);

    expect(info).toHaveBeenCalledTimes(1);
    expect(error).not.toHaveBeenCalled();

    log.setLevel(LogLevel.error);

    pipe.emit('input', 'hello', ctx);
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

    pipe.emit('input', 'hello', ctx);

    expect(info).not.toHaveBeenCalled();

    await ctx.executor.step(ctx);
    expect(info).toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    await ctx.executor.step(ctx);
    expect(error).not.toHaveBeenCalled();
    await ctx.executor.step(ctx);
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

    pipe.emit('input', 'hello', ctx);

    await ctx.executor.next(ctx);
    expect(error).not.toHaveBeenCalled();
    await ctx.executor.next(ctx);
    expect(error).toHaveBeenCalled();
  });
});
