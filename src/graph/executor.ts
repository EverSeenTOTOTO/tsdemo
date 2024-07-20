import EventEmitter from 'events';
import { call, ExtendArray as Queue } from '@/utils';
import { IContext, IExecutor, Task } from './types';

export class Executor extends EventEmitter implements IExecutor {
  private pending: Queue<Task> = new Queue();

  clone(): Executor {
    const executor = new Executor();

    executor.pending = new Queue(...this.pending);

    return executor;
  }

  submit(task: Task): void {
    this.emit('submit', task);
    this.pending.push(task);
  }

  clear() {
    this.pending = new Queue();
  }

  // 从pending中取出一个task，并执行
  async step(ctx: IContext): Promise<void> {
    const first = this.pending.shift();

    // if (first?.description) {
    //   console.log(first.description);
    // }

    this.emit('step', first);

    return first ? call(first.action, ctx) : Promise.resolve();
  }

  async next(ctx: IContext): Promise<void> {
    // 执行直到pending为空，执行过程中新增的task会被放入pending中
    // 为了复用step，在pending中间加一个$标记
    const sym = Symbol('$');

    this.pending.push({
      action() {
        /*TODO*/
      },
      description: sym,
    });

    while (this.pending.head()?.description !== sym) {
      await this.step(ctx);
    }

    this.pending.shift();
  }

  async run(ctx: IContext): Promise<void> {
    while (this.pending.head()) await this.next(ctx);
  }
}
