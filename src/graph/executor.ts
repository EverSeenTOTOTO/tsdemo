import { call, ExtendArray as Queue } from '@/utils';
import { IExecutor, Task, IContext } from './types';

export class Executor implements IExecutor {
  private pending: Queue<Task> = new Queue();

  clone(): Executor {
    const executor = new Executor();

    executor.pending = new Queue(...this.pending);

    return executor;
  }

  submit(task: Task): void {
    this.pending.push(task);
  }

  reset() {
    this.pending = new Queue();
  }

  // 从pending中取出一个task，并执行
  async step(ctx: IContext): Promise<void> {
    const first = this.pending.shift();

    return first ? call(first.action, ctx) : Promise.resolve();
  }

  // 执行直到pending为空，执行过程中新增的task会被放入pending中，下一次next才执行，所以开头交换current和pending
  async next(ctx: IContext): Promise<void> {
    const current = this.pending;

    this.pending = new Queue();

    while (current.head()) {
      const first = current.shift();

      await call(first!.action, ctx);
    }
  }

  async run(ctx: IContext): Promise<void> {
    while (this.pending.head()) await this.next(ctx);
  }
}
