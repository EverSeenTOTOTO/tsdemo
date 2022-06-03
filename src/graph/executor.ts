import { call, ExtendArray as Queue } from '@/utils';
import { IExecutor, Task, IContext } from './types';

export class Executor implements IExecutor {
  private pending: Queue<Task> = new Queue();

  private undos: Queue<Task> = new Queue();

  clone(): Executor {
    const executor = new Executor();

    executor.pending = new Queue(...this.pending);
    executor.undos = new Queue(...this.undos);

    return executor;
  }

  submit(task: Task): void {
    this.pending.push(task);
  }

  reset() {
    this.pending = new Queue();
    this.undos = new Queue();
  }

  protected async exec(task: Task, ctx: IContext): Promise<void> {
    const undo = await call(task.func, ctx) as Task;

    if (undo) {
      this.undos.push({
        desc: undo.desc,
        func: () => {
          this.pending.unshift(task);
          return call(undo.func, ctx);
        },
      });
    }
  }

  // 从pending中取出一个task，并执行
  async step(ctx: IContext): Promise<void> {
    const first = this.pending.shift();

    return first ? this.exec(first, ctx) : Promise.resolve();
  }

  // 从undos中取出一个task，并执行
  back(ctx: IContext): Promise<void> {
    const top = this.undos.pop();

    return top ? call(top.func, ctx) : Promise.resolve();
  }

  // 执行直到pending为空，执行过程中新增的task会被放入pending中，下一次next才执行，所以开头交换current和pending
  async next(ctx: IContext): Promise<void> {
    const current = this.pending;
    this.pending = new Queue();

    while (current.head()) {
      const first = current.shift();
      if (first) {
        await this.exec(first, ctx);
      }
    }
  }

  // 执行直到undos为空
  async prev(ctx: IContext): Promise<void> {
    while (this.undos.top()) {
      await this.back(ctx);
    }
  }
}
