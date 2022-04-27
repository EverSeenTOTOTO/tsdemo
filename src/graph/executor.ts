import { call, Callback, ExtendArray as Queue } from '@/utils';
import { IExecutor, IContext } from './types';

export class Executor implements IExecutor {
  private pending: Queue<Callback> = new Queue();

  private undos: Queue<Callback> = new Queue();

  clone(): Executor {
    const executor = new Executor();

    executor.pending = new Queue(...this.pending);
    executor.undos = new Queue(...this.undos);

    return executor;
  }

  submit(callback: Callback): void {
    this.pending.push(callback);
  }

  reset() {
    this.pending = new Queue();
    this.undos = new Queue();
  }

  protected async exec(callback: Callback, ctx?: IContext): Promise<void> {
    const undo = await call(callback, ctx);

    if (undo) {
      this.undos.push(() => {
        this.pending.unshift(callback);
        return call(undo, ctx);
      });
    }
  }

  // 从pending中取出一个callback，并执行
  async step(ctx?: IContext): Promise<void> {
    const first = this.pending.shift();

    if (first) {
      await this.exec(first, ctx);
    }

    return Promise.resolve();
  }

  // 从undos中取出一个callback，并执行
  back(ctx?: IContext): Promise<void> {
    const top = this.undos.pop();

    return top ? call(top, ctx) : Promise.resolve();
  }

  // 执行直到pending为空，执行过程中新增的callback会被放入pending中，下一次next才执行，所以开头交换current和pending
  async next(ctx?: IContext): Promise<void> {
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
  async prev(ctx?: IContext): Promise<void> {
    while (this.undos.top()) {
      await this.back(ctx);
    }
  }
}
