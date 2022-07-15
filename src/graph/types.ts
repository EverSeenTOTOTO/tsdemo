export interface ISlot<S> {
  name: S;
  node: INode<S, any, any>;

  clone(): ISlot<S>;
}

export interface INode<S, I, O> {
  name: string;
  slots: ISlot<S>[];

  clone(): INode<S, I, O>;

  getSlot(name: S): ISlot<S> | undefined;
  addSlot(slot: ISlot<S>): void;
  removeSlot(slot: ISlot<S>, ctx?: IContext): void;

  emit(slot: S, value: I, ctx: IContext): void;
}

export interface IConnection<S1, S2> {
  from: ISlot<S1>;
  to: ISlot<S2>;
}

export type Task = {
  action: (ctx?: IContext) => Task | void | Promise<Task | void>;
  description?: string | symbol;
};

export interface IExecutor {
  clone(): IExecutor;

  submit(task: Task): void;

  clear(): void;
  run(ctx: IContext): Promise<void>;
  step(ctx: IContext): Promise<void>;
  next(ctx: IContext): Promise<void>;
  // back(ctx: IContext): Promise<void>;
  // prev(ctx: IContext): Promise<void>;
}

export interface IContext {
  nodes: INode<any, any, any>[];
  connections: IConnection<any, any>[];
  executor: IExecutor;

  clone(): IContext;
  clear(): void;

  emit<S, I, O>(node: INode<S, I, O>, slot: S, value: I): void;

  run(): Promise<void>;
  step(): Promise<void>;
  next(): Promise<void>;
  // back(): Promise<void>;
  // prev(): Promise<void>;

  connect<S1, S2, V>(from: INode<S1, any, V>, fromSlot: S1, to: INode<S2, V, any>, toSlot: S2): IConnection<S1, S2>;
  disconnect<S1, S2, V>(from: INode<S1, any, V>, fromSlot: S1, to: INode<S2, V, any>, toSlot: S2): void;

  contains(x: INode<any, any, any> | IConnection<any, any>): boolean;

  getNode(name: string): INode<any, any, any> | undefined;
  getConnection<S1, S2>(from: ISlot<S1>, to: ISlot<S2>): IConnection<S1, S2> | undefined;
  getConnectionsByFrom<S>(from: ISlot<S>): IConnection<S, any>[];
  getConnectionsByTo<S>(to: ISlot<S>): IConnection<any, S>[];

  addNodes(...nodes: INode<any, any, any>[]): void;

  removeNode(node: INode<any, any, any>): void;
  removeConnectionBySlot(slot: ISlot<any>): void;
  removeConnectionByNode(node: INode<any, any, any>): void;
}
