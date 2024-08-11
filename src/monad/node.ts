export class Slot {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

export class Edge {
  id: string;
  from: Slot;
  to: Slot;

  constructor(id: string, from: Slot, to: Slot) {
    this.id = id;
    this.from = from;
    this.to = to;
  }
}

export class Context {
  nodes: Map<string, Node> = new Map();
  edges: Map<string, Edge> = new Map();
  slotIndexMap: WeakMap<Slot, { node: Node; edges?: Map<string, Edge> }> =
    new WeakMap();

  get nodeCount(): number {
    return this.nodes.size;
  }

  get edgeCount(): number {
    return this.edges.size;
  }

  addNode(node: Node): Context {
    this.nodes.set(node.id, node);
    node.slots.forEach(slot => {
      this.slotIndexMap.set(slot, { node });
    });
    return this;
  }

  protected addEdge(edge: Edge): Context {
    this.edges.set(edge.id, edge);

    const from = this.slotIndexMap.get(edge.from);

    if (!from) {
      throw new Error(`Slot ${edge.from.name} for edge ${edge.id} not found.`);
    }

    from.edges = from.edges || new Map();
    from.edges.set(edge.id, edge);

    const to = this.slotIndexMap.get(edge.to);

    if (!to) {
      throw new Error(`Slot ${edge.to.name} for edge ${edge.id} not found.`);
    }

    to.edges = to.edges || new Map();
    to.edges.set(edge.id, edge);

    return this;
  }

  connect(edgeId: string, from: Slot, to: Slot): Context {
    const edge = new Edge(edgeId, from, to);
    this.addEdge(edge);
    return this;
  }

  deleteNode(nodeId: string): Context {
    const node = this.nodes.get(nodeId);

    node?.slots.forEach(slot => {
      const { edges } = this.slotIndexMap.get(slot) || {};

      edges?.forEach(edge => {
        this.edges.delete(edge.id);
      });
      this.slotIndexMap.delete(slot);
    });
    this.nodes.delete(nodeId);

    return this;
  }

  deleteEdge(edgeId: string): Context {
    const edge = this.edges.get(edgeId);

    if (edge) {
      const from = this.slotIndexMap.get(edge.from);

      if (from) {
        from.edges?.delete(edgeId);
      }

      const to = this.slotIndexMap.get(edge.to);

      if (to) {
        to.edges?.delete(edgeId);
      }
    }

    this.edges.delete(edgeId);
    return this;
  }

  getNode(slot: Slot): Node | undefined;
  getNode(nodeId: string): Node | undefined;
  getNode(param: any): Node | undefined {
    if (param instanceof Slot) {
      return this.slotIndexMap.get(param)?.node;
    }

    return this.nodes.get(param);
  }

  getEdges(slot: Slot): Map<string, Edge> {
    return this.slotIndexMap.get(slot)?.edges || new Map();
  }

  getEdge(edgeId: string): Edge | undefined {
    return this.edges.get(edgeId);
  }
}

export abstract class Node {
  id: string;
  slots: Map<string, Slot> = new Map();

  constructor(id: string) {
    this.id = id;
  }

  defineSlot(slot: Slot): Node {
    this.slots.set(slot.name, slot);
    return this;
  }

  abstract async onExecute(ctx: Context): Promise<void>;
}
