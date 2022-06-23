import { parseExpr, Node } from './parse';
import { lookahead } from './scan';
import { Position } from './utils';

export const parse = (input: string, pos = new Position()) => {
  const nodes: Node[] = [];

  while (lookahead(input, pos).type !== 'eof') {
    nodes.push(parseExpr(input, pos));
  }

  return nodes;
};
