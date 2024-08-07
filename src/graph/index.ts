/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { ISlot, INode, IConnection, IContext, IExecutor } from './types';

export * from './types';

export class Slot<S> implements ISlot<S> {
  public readonly name: S;

  public node: INode<S, any, any>;

  constructor(name: S, node: INode<S, any, any>) {
    this.name = name;
    this.node = node;
  }

  clone(): ISlot<S> {
    return new Slot(this.name, this.node);
  }
}

export class Connection<S1, S2> implements IConnection<S1, S2> {
  public readonly from: Slot<S1>;

  public readonly to: Slot<S2>;

  constructor(from: Slot<S1>, to: Slot<S2>) {
    this.from = from;
    this.to = to;
  }
}

export class Node<S, I, O> implements INode<S, I, O> {
  public readonly name: string;

  public slots: ISlot<S>[];

  constructor(name: string) {
    this.name = name;
    this.slots = [];
  }

  clone(): INode<S, I, O> {
    const node = new Node<S, I, O>(this.name);

    this.slots.forEach(slot => {
      node.addSlot(slot.clone());
    });

    return node;
  }

  getSlot(name: S): ISlot<S> | undefined {
    return this.slots.find(slot => slot.name === name);
  }

  addSlot(slot: ISlot<S>): void {
    const exist = this.getSlot(slot.name);

    if (exist) {
      throw new Error(`Slot ${slot.name} already exist`);
    }

    this.slots.push(slot);
  }

  removeSlot(slot: ISlot<S>, ctx?: IContext): void {
    const exist = this.getSlot(slot.name);

    if (exist) {
      this.slots = this.slots.filter(s => s !== slot);
      ctx?.removeConnectionBySlot(exist);
    }
  }

  emit(_slot: S, _value: I, _ctx: IContext): void {
    throw new Error('Method not implemented.');
  }
}

export class Context implements IContext {
  nodes: INode<any, any, any>[] = [];

  connections: IConnection<any, any>[] = [];

  executor: IExecutor;

  constructor(executor: IExecutor) {
    this.executor = executor;
  }

  clear() {
    this.nodes = [];
    this.connections = [];
    this.executor.clear();
  }

  clone() {
    const ctx = new Context(this.executor.clone());

    this.nodes.forEach(node => {
      ctx.addNodes(node.clone());
    });

    // cannot clone connection directly
    this.connections.forEach(connection => {
      const from = ctx.getNode(connection.from.node.name);
      const to = ctx.getNode(connection.to.node.name);

      if (from && to) {
        ctx.connect(from, connection.from.name, to, connection.to.name);
      }
    });

    return ctx;
  }

  emit<S, I, O>(node: INode<S, I, O>, slot: S, value: I) {
    node.emit(slot, value, this);
  }

  run(): Promise<void> {
    return this.executor.run(this);
  }

  step(): Promise<void> {
    return this.executor.step(this);
  }

  next(): Promise<void> {
    return this.executor.next(this);
  }

  connect<S1, S2, V>(
    from: INode<S1, any, V>,
    fromSlot: S1,
    to: INode<S2, V, any>,
    toSlot: S2,
  ): IConnection<S1, S2> {
    const fromS = from.getSlot(fromSlot);
    const toS = to.getSlot(toSlot);

    if (!fromS) {
      throw new Error(`${from.name} has no slot ${fromSlot}`);
    }

    if (!toS) {
      throw new Error(`${to.name} has no slot ${toSlot}`);
    }

    const connection = new Connection(fromS, toS);
    this.connections.push(connection);

    return connection;
  }

  disconnect<S1, S2, V>(
    from: INode<S1, any, V>,
    fromSlot: S1,
    to: INode<S2, V, any>,
    toSlot: S2,
  ): void {
    const fromS = from.getSlot(fromSlot);
    const toS = to.getSlot(toSlot);

    if (fromS && toS) {
      const idx = this.connections.findIndex(
        c => c.from === fromS && c.to === toS,
      );

      if (idx !== -1) {
        this.connections.splice(idx, 1);
      }
    }
  }

  contains(x: INode<any, any, any> | IConnection<any, any>): boolean {
    if (x instanceof Connection) {
      return this.connections.includes(x);
    }

    if (x instanceof Node) {
      return this.nodes.includes(x);
    }

    return false;
  }

  getNode(name: string): INode<any, any, any> | undefined {
    return this.nodes.find(n => n.name === name);
  }

  getConnection<S1, S2>(
    from: ISlot<S1>,
    to: ISlot<S2>,
  ): IConnection<S1, S2> | undefined {
    return this.connections.find(c => c.from === from && c.to === to);
  }

  getConnectionsByFrom<S>(from: ISlot<S>): IConnection<S, any>[] {
    return this.connections.filter(c => c.from === from);
  }

  getConnectionsByTo<S>(to: ISlot<S>): IConnection<any, S>[] {
    return this.connections.filter(c => c.to === to);
  }

  addNodes(...nodes: INode<any, any, any>[]) {
    this.nodes.push(...nodes);
  }

  removeNode(node: INode<any, any, any>): void {
    const idx = this.nodes.findIndex(n => n === node);

    if (idx !== -1) {
      this.removeConnectionByNode(node);
      this.nodes.splice(idx, 1);
    }
  }

  removeConnectionBySlot(slot: ISlot<any>): void {
    this.connections = this.connections.filter(
      c => c.from !== slot && c.to !== slot,
    );
  }

  removeConnectionByNode(node: INode<any, any, any>): void {
    this.connections = this.connections.filter(
      c => c.from.node !== node && c.to.node !== node,
    );
  }
}
