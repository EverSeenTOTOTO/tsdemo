/* eslint-disable max-classes-per-file */
/* eslint-disable no-param-reassign */
import { codeFrameColumns } from '@babel/code-frame';

export class Position {
  line: number;

  column: number;

  cursor: number;

  constructor(row = 0, column = 0, cursor = 0) {
    this.line = row;
    this.column = column;
    this.cursor = cursor;
  }

  clone(): Position {
    return new Position(this.line, this.column, this.cursor);
  }

  copy(another: Position) {
    this.line = another.line;
    this.column = another.column;
    this.cursor = another.cursor;
  }

  str() {
    return JSON.stringify(this);
  }
}

export const codeFrame = (input: string, message: string, start: Position, end?: Position): string => {
  return codeFrameColumns(
    input,
    {
      start: {
        line: start.line + 1, // @babel/code-frame starts from 1
        column: start.column + 1,
      },
      end: end
        ? {
          line: end.line + 1,
          column: end.column + 1,
        }
        : undefined,
    },
    {
      message,
    },
  );
};

export type Token = {
  readonly type: 'id' | 'space' | 'eof' | '~' | '+' | '(' | ')',
  readonly source: string,
  readonly pos: Position
};

export const makeToken = (type: Token['type'], pos: Position, source: string): Token => {
  const snapshot = pos.clone();

  pos.column += source.length;
  pos.cursor += source.length;

  return {
    type,
    pos: snapshot,
    source,
  };
};

export function raise(input: string, pos: Position): Token {
  if (pos.cursor >= input.length) return { type: 'eof', pos, source: 'eof' };

  const pivot = input[pos.cursor];

  if (/[A-Z]/.test(pivot)) return readIdentifier(input, pos);
  if (/\s/.test(pivot)) return readWhitespace(input, pos);
  if (/~|\+|\(|\)/.test(pivot)) return makeToken(pivot as '~', pos, pivot);

  throw new Error(codeFrame(input, `Syntax error, unrecogonized character: ${pivot}`, pos));
}

const ID_REGEX = /^[A-Z][0-9]*/;
export function readIdentifier(input: string, pos: Position): Token {
  const match = ID_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    const text = match[0];

    return makeToken('id', pos, text);
  }

  throw new Error(codeFrame(input, 'Syntax error, expected <identifier>', pos));
}

// read only 1 space character, comment is not considered
export function readWhitespace(input: string, pos: Position): Token {
  const backup = pos.clone();

  if (/^\r\n/.test(input.slice(pos.cursor))) { // \r\n first
    pos.cursor += 2;
    pos.line += 1;
    pos.column = 0;
  } else if (/ |\t/.test(input[pos.cursor])) {
    pos.cursor++;
    pos.column++;
  } else if (/\n/.test(input[pos.cursor])) {
    pos.cursor += 1;
    pos.line += 1;
    pos.column = 0;
  } else {
    throw new Error(codeFrame(input, 'Syntax error, expected <space>', pos));
  }

  return { type: 'space', source: input.slice(0, pos.cursor - backup.cursor), pos: backup };
}

export function skipWhitespace(input: string, pos: Position) {
  while (/\s/m.test(input[pos.cursor])) {
    readWhitespace(input, pos);
  }

  return pos;
}

export function lookahead(input: string, pos: Position) {
  const backup = pos.clone();
  const token = raise(input, pos);

  pos.copy(backup);

  return token;
}

// try read expected token, throw if fail
export function expect(expected: Token['type'] | Token['type'][], input: string, pos: Position) {
  const token = raise(input, pos);
  const types = Array.isArray(expected) ? expected : [expected];

  if (types.indexOf(token.type) === -1) {
    const message = codeFrame(input, `Syntax error, expect "${types.join(',')}", got ${token.type}`, pos);

    pos.copy(token.pos); // rollback

    throw new Error(message);
  }

  return token;
}

export class Item {
  readonly type: 'id' | 'pare' | 'not' | 'and' | 'or';

  readonly pos: Position;

  constructor(type: Item['type'], loc: Position) {
    this.type = type;
    this.pos = loc;
  }

  str() {
    return JSON.stringify(this, null, 2);
  }
}

export class IdItem extends Item {
  readonly name: Token;

  constructor(id: Token) {
    super('id', id.pos);
    this.name = id;
  }
}

export class PareItem extends Item {
  readonly parentheseL: Token;

  readonly parentheseR: Token;

  readonly master: Item;

  constructor(pl: Token, pr: Token, master: Item) {
    super('pare', pl.pos);
    this.parentheseL = pl;
    this.parentheseR = pr;
    this.master = master;
  }
}

export class NotItem extends Item {
  readonly not: Token;

  readonly master: Item;

  constructor(not: Token, master: Item) {
    super('not', not.pos);
    this.not = not;
    this.master = master;
  }
}

export class AndItem extends Item {
  readonly lhs: Item;

  readonly rhs: Item;

  constructor(lhs: Item, rhs: Item) {
    super('and', lhs.pos);
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

export class OrItem extends Item {
  readonly plus: Token;

  readonly lhs: Item;

  readonly rhs: Item;

  constructor(plus: Token, lhs: Item, rhs: Item) {
    super('or', lhs.pos);
    this.plus = plus;
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

export function parseExpr(source: string, pos = new Position()): Item {
  skipWhitespace(source, pos);

  let lhs = parseExpr1(source, pos);

  skipWhitespace(source, pos);

  let next = lookahead(source, pos);

  while (next.type === '+') {
    const plus = expect('+', source, pos);
    const rhs = parseExpr1(source, pos);

    lhs = new OrItem(plus, lhs, rhs);
    skipWhitespace(source, pos);
    next = lookahead(source, pos);
  }

  return lhs;
}

export function parseExpr1(source: string, pos: Position) {
  let lhs: Item = parseLeading(source, pos);

  skipWhitespace(source, pos);

  let next = lookahead(source, pos);

  while (['(', '~', 'id'].indexOf(next.type) !== -1) {
    const rhs = parseLeading(source, pos);

    lhs = new AndItem(lhs, rhs);
    skipWhitespace(source, pos);
    next = lookahead(source, pos);
  }

  return lhs;
}

function parseLeading(source: string, pos: Position) {
  skipWhitespace(source, pos);

  const next = lookahead(source, pos);

  switch (next.type) {
    case '(':
      return parseParentheses(source, pos);
    case '~':
      return parseNot(source, pos);
    case 'id':
      return parseId(source, pos);
    default:
      throw new Error(codeFrame(source, `Syntax error, unexpect token: ${next.type}`, pos));
  }
}

function parseParentheses(source: string, pos: Position) {
  const pl = expect('(', source, pos);

  skipWhitespace(source, pos);

  const master = parseExpr(source, pos);

  skipWhitespace(source, pos);

  return new PareItem(pl, expect(')', source, pos), master);
}

function parseNot(source: string, pos: Position): NotItem {
  const not = expect('~', source, pos);

  skipWhitespace(source, pos);

  return new NotItem(not, parseLeading(source, pos));
}

function parseId(input: string, pos: Position) {
  const id = expect('id', input, pos);

  return new IdItem(id);
}
