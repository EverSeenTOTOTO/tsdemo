/* eslint-disable no-constant-condition */
/* eslint-disable max-classes-per-file */
import * as scan from './scan';

class Node {
  readonly type: 'Func' | 'Assign' | 'BinOpExpr' | 'UnOpExpr' | 'Id' | 'Lit' | 'Expr' | 'Square' | 'Dot' | 'Expand';

  constructor(type: Node['type']) {
    this.type = type;
  }

  str() {
    return JSON.stringify(this, null, 2);
  }
}

export class Square extends Node {
  readonly children: Node[];

  readonly bracketL: scan.Token;

  readonly bracketR: scan.Token;

  constructor(bl: scan.Token, br: scan.Token, children: Node[]) {
    super('Square');
    this.bracketL = bl;
    this.bracketR = br;
    this.children = children;
  }

  isEmpty() {
    return this.children.length === 0;
  }
}

export class Expr extends Node {
  readonly master: Node | Square;

  readonly dot?: Dot;

  constructor(expr: Expr['master'], dot?: Dot) {
    super('Expr');
    this.master = expr;
    this.dot = dot;
  }
}

export class Dot extends Node {
  readonly dot: scan.Token;

  readonly id: Id;

  readonly next?: Dot;

  constructor(dot: scan.Token, id: Id, next?: Dot) {
    super('Dot');
    this.dot = dot;
    this.id = id;
    this.next = next;
  }
}

export class Id extends Node {
  readonly name: scan.Token;

  constructor(id: scan.Token) {
    super('Id');
    this.name = id;
  }
}

export class Expand extends Node {
  readonly bracketL: scan.Token;

  readonly bracketR: scan.Token;

  readonly items: (scan.Token | Node | Expand)[];

  constructor(bl: scan.Token, br: scan.Token, items: Expand['items']) {
    super('Expand');
    this.bracketL = bl;
    this.bracketR = br;
    this.items = items;
  }
}

export class Func extends Node {
  readonly slash: scan.Token;

  readonly param: Expand | Square; // Square can be [] while Expand cannot

  readonly body: Expr;

  constructor(slash: scan.Token, param: Func['param'], body: Expr) {
    super('Func');
    this.slash = slash;
    this.param = param;
    this.body = body;
  }
}

export class Assign extends Node {
  readonly eq: scan.Token;

  readonly variable: Id | Expand;

  readonly assignment: Expr;

  constructor(eq: scan.Token, variable: Assign['variable'], expr: Expr) {
    super('Assign');
    this.eq = eq;
    this.variable = variable;
    this.assignment = expr;
  }
}

export class Lit extends Node {
  readonly value: scan.Token;

  constructor(value: scan.Token) {
    super('Lit');
    this.value = value;
  }
}

export class UnOpExpr extends Node {
  readonly op: scan.Token;

  readonly value: Expr;

  constructor(op: scan.Token, expr: Expr) {
    super('UnOpExpr');
    this.op = op;
    this.value = expr;
  }
}

export class BinOpExpr extends Node {
  readonly op: scan.Token;

  readonly lhs: Expr;

  readonly rhs: Expr;

  constructor(op: scan.Token, lhs: Expr, rhs: Expr) {
    super('BinOpExpr');
    this.op = op;
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

export function parseExpr(input: string, pos = new scan.Position()): Expr {
  scan.skipWhitespace(input, pos);

  const next = scan.lookahead(input, pos);

  const expr = next.type === '['
    ? parseSquareExprs(input, pos)
    : parseOtherExprs(input, pos);

  scan.skipWhitespace(input, pos);

  const dot = scan.lookahead(input, pos);

  return new Expr(expr, dot.type === '.' ? parseDot(input, pos) : undefined);
}

function parseSquareExprs(input: string, pos: scan.Position) {
  const bl = scan.expect('[', input, pos);
  scan.skipWhitespace(input, pos);

  let next: scan.Token | undefined = scan.lookahead(input, pos);
  const children: Node[] = [];

  switch (next.type) {
    case '..':
    case '-':
      children.push(parseBinOpExpr(input, pos));
      break;
    case '=':
      children.push(parseAssign(input, pos));
      break;
    case '!':
    case '...':
      children.push(parseUnOpExpr(input, pos));
      break;
    default: { // [ <expr>* ]
      while (next.type !== ']') {
        children.push(parseExpr(input, pos));
        scan.skipWhitespace(input, pos);
        next = scan.lookahead(input, pos);
      }
    }
  }

  scan.skipWhitespace(input, pos);
  next = scan.expect(']', input, pos);

  return new Square(bl, next, children);
}

function parseOtherExprs(input: string, pos: scan.Position) {
  const next = scan.lookahead(input, pos);

  switch (next.type) {
    case '/': {
      const sibling = scan.lookahead(input, pos, 2);

      if (sibling.type === 'space') {
        return parseBinOpExpr(input, pos);
      }

      if (sibling.type === '[') {
        return parseFunc(input, pos);
      }

      throw new Error(`Syntax error, expect <space> or "[", got "${sibling.type}", pos: ${pos.str()}`);
    }
    case 'id':
      return parseId(input, pos);
    case 'str':
    case 'num':
    case 'bool':
      return parseLit(input, pos);
    default:
      throw new Error(`Syntax error, expect <expr>, got "${next.type}", pos: ${next.pos.str()}`);
  }
}

export function parseFunc(input: string, pos: scan.Position): Func {
  const slash = scan.expect('/', input, pos);

  scan.skipWhitespace(input, pos);

  const next = scan.lookahead(input, pos, 2);
  const param = next.type === ']'
    ? new Square(scan.expect('[', input, pos), scan.expect(']', input, pos), [])
    : parseExpand(input, pos);

  scan.skipWhitespace(input, pos);

  const body = parseExpr(input, pos);

  return new Func(slash, param, body);
}

export function parseExpand(input: string, pos: scan.Position) {
  const bl = scan.expect('[', input, pos);

  scan.skipWhitespace(input, pos);

  const items: Expand['items'] = [];
  let next = scan.lookahead(input, pos);

  while (next.type !== ']') {
    switch (next.type) {
      case '.':
      case '...':
        items.push(scan.expect(next.type, input, pos));
        break;
      case 'str':
      case 'num':
      case 'bool':
        items.push(parseLit(input, pos));
        break;
      case 'id':
        items.push(parseId(input, pos));
        break;
      case '[':
        items.push(parseExpand(input, pos));
        break;
      default:
        throw new Error(`Syntax error, expect <expand>, got "${next.type}", pos: ${next.pos.str()}`);
    }
    scan.skipWhitespace(input, pos);
    next = scan.lookahead(input, pos);
  }

  next = scan.expect(']', input, pos);

  return new Expand(bl, next, items);
}

export function parseAssign(input: string, pos: scan.Position) {
  const eq = scan.expect('=', input, pos);

  scan.skipWhitespace(input, pos);

  const next = scan.lookahead(input, pos);
  // eslint-disable-next-line no-nested-ternary
  const variable = next.type === '['
    ? parseExpand(input, pos)
    : next.type === 'id'
      ? parseId(input, pos)
      : (() => { throw new Error(`Syntax error, expect <id>, got "${next.type}", pos: ${next.pos.str()}`); })();

  scan.skipWhitespace(input, pos);

  const expr = parseExpr(input, pos);

  return new Assign(eq, variable, expr);
}

export function parseId(input: string, pos: scan.Position) {
  const id = scan.expect('id', input, pos);

  return new Id(id);
}

export function parseLit(input: string, pos: scan.Position) {
  const token = scan.expect(['str', 'num', 'bool'], input, pos);

  return new Lit(token);
}

export function parseDot(input: string, pos: scan.Position): Dot {
  const dot = scan.expect('.', input, pos);

  scan.skipWhitespace(input, pos);

  const id = parseId(input, pos);

  scan.skipWhitespace(input, pos);

  const nextDot = scan.lookahead(input, pos);

  return new Dot(dot, id, nextDot.type === '.' ? parseDot(input, pos) : undefined);
}

export function parseUnOpExpr(input: string, pos: scan.Position) {
  const op = scan.expect(['!', '...'], input, pos);

  scan.skipWhitespace(input, pos);

  const expr = parseExpr(input, pos);

  return new UnOpExpr(op, expr);
}

export function parseBinOpExpr(input: string, pos: scan.Position) {
  const op = scan.expect(['-', '..', '/'], input, pos);

  scan.skipWhitespace(input, pos);

  const lhs = parseExpr(input, pos);

  scan.skipWhitespace(input, pos);

  const rhs = parseExpr(input, pos);

  return new BinOpExpr(op, lhs, rhs);
}
