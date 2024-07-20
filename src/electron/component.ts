/* eslint-disable max-classes-per-file */
import { IContext, Node } from '@/graph';
import { PipeNode } from '@/graph/nodes';
import { AndGate, NotGate, OrGate } from './gate';
import {
  parseExpr,
  Item,
  IdItem,
  PareItem,
  NotItem,
  AndItem,
  OrItem,
} from './parse';

export function createComponent(source: string, ctx: IContext) {
  const expr = parseExpr(source);

  // console.log(expr.str());

  return createItem(expr, ctx);
}

function createItem(item: Item, ctx: IContext): Node<string, number, number> {
  switch (item.type) {
    case 'id':
      return createWire(item as IdItem, ctx);
    case 'pare':
      return createItem((item as PareItem).master, ctx);
    case 'not':
      return createNot(item as NotItem, ctx);
    case 'and':
      return createAnd(item as AndItem, ctx);
    case 'or':
      return createOr(item as OrItem, ctx);
    default:
      throw new Error(`Unknown component type: ${item.type}`);
  }
}

function createWire(id: IdItem, ctx: IContext) {
  if (ctx.getNode(id.name.source)) {
    return ctx.getNode(id.name.source)!;
  }

  const wire = new PipeNode(id.name.source);

  ctx.addNodes(wire);

  return wire;
}

function createNot(not: NotItem, ctx: IContext) {
  const master = createItem(not.master, ctx);
  const notGate = new NotGate('not');

  ctx.connect(master, 'output', notGate, 'input');

  return notGate;
}

function createOr(or: OrItem, ctx: IContext) {
  const lhs = createItem(or.lhs, ctx);
  const rhs = createItem(or.rhs, ctx);
  const orGate = new OrGate('or');

  ctx.connect(lhs, 'output', orGate, 'lhs');
  ctx.connect(rhs, 'output', orGate, 'rhs');

  return orGate;
}

function createAnd(and: AndItem, ctx: IContext) {
  const lhs = createItem(and.lhs, ctx);
  const rhs = createItem(and.rhs, ctx);
  const andGate = new AndGate('and');

  ctx.connect(lhs, 'output', andGate, 'lhs');
  ctx.connect(rhs, 'output', andGate, 'rhs');

  return andGate;
}
