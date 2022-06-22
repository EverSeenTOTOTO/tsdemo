/* eslint-disable no-param-reassign */
/* eslint-disable no-constant-condition */
export class Position {
  row: number;

  column: number;

  cursor: number;

  constructor(row = 0, column = 0, cursor = 0) {
    this.row = row;
    this.column = column;
    this.cursor = cursor;
  }

  clone(): Position {
    return new Position(this.row, this.column, this.cursor);
  }

  copy(another: Position) {
    this.row = another.row;
    this.column = another.column;
    this.cursor = another.cursor;
  }

  str() {
    return JSON.stringify(this);
  }
}

export type Token = {
  readonly type: 'space' | 'str' | 'num' | 'bool' | 'id' | 'comment' | 'eof' | '.' | '..' | '...' | ';' | '[' | ']' | '/' | '=' | '!' | '-';
  readonly source: string;
  readonly pos: Position;
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

// !!! side effect
export function raise(input: string, pos: Position): Token {
  if (pos.cursor >= input.length) return { type: 'eof', pos, source: 'eof' };

  const pivot = input[pos.cursor];

  if (/'/.test(pivot)) { return readString(input, pos); }
  if (/[0-9]/.test(pivot)) { return readNumber(input, pos); }
  if (/[a-zA-Z_]/.test(pivot)) { return readIdentifier(input, pos); }
  if (/\./.test(pivot)) { return readDot(input, pos); }
  if (/(?:\[|\]|\/|=|!|-)/.test(pivot)) return makeToken(pivot as '=', pos, pivot);
  if (/\s/.test(pivot)) return readWhitespace(input, pos);

  throw new Error(`Lexical error, unrecogonized character: "${pivot}", pos: ${pos.str()}`);
}

const STRING_REGEX = /^'(?:[^'\\\n\r]|\\')*'/;
export function readString(input: string, pos: Position): Token {
  const match = STRING_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken('str', pos, match[0]);
  }

  throw new Error(`Lexical error, expected string, pos: ${pos.str()}`);
}

const NUMBER_REGEX = /^\d+(?:\.\d+)?(?:e\d+)?/;
export function readNumber(input: string, pos: Position): Token {
  const match = NUMBER_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken('num', pos, match[0]);
  }

  throw new Error(`Lexical error, expected number, pos: ${pos.str()}`);
}

const ID_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]*/;
const BOOL_REGEX = /^(?:true|false)$/;
export function readIdentifier(input: string, pos: Position): Token {
  const match = ID_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    const text = match[0];

    return BOOL_REGEX.test(text)
      ? makeToken('bool', pos, text)
      : makeToken('id', pos, text);
  }

  throw new Error(`Lexical error, expected identifier, pos: ${pos.str()}`);
}

const DOT_REGEX = /^(?:\.\.?\.?)/;
export function readDot(input: string, pos: Position): Token {
  const match = DOT_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken(match[0] as '.', pos, match[0]);
  }

  throw new Error(`Lexical error, expected dot, pos: ${pos.str()}`);
}

const COMMENT_REGEX = /^;([^;\\\r\n]|\\;)*;?/;
export function readComment(input: string, pos: Position): Token {
  const match = COMMENT_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken('comment', pos, match[0]);
  }

  throw new Error(`Lexical error, expected comment, pos: ${pos.str()}`);
}

export function readWhitespace(input: string, pos: Position): Token {
  const backup = pos.clone();

  if (/^\r\n/.test(input.slice(pos.cursor))) { // \r\n first
    pos.cursor += 2;
    pos.row += 1;
    pos.column = 0;
  } else if (/ |\t/.test(input[pos.cursor])) {
    pos.cursor++;
    pos.column++;
  } else if (/\n/.test(input[pos.cursor])) {
    pos.cursor += 1;
    pos.row += 1;
    pos.column = 0;
  } else {
    throw new Error(`Lexical error, expected space, pos: ${pos.str()}`);
  }

  return { type: 'space', source: input.slice(0, pos.cursor - backup.cursor), pos: backup };
}

// !!! side effect
export function skipWhitespace(input: string, pos: Position) {
  while (true) {
    if (/\s/m.test(input[pos.cursor])) {
      readWhitespace(input, pos);
    } else if (/;/.test(input[pos.cursor])) {
      readComment(input, pos);
    } else {
      break;
    }
  }

  return pos;
}

export function lookahead(input: string, pos: Position, count = 1) {
  const backup = pos.clone();
  let token = raise(input, pos);

  while (--count > 0) {
    token = raise(input, pos);
  }

  pos.copy(backup);

  return token;
}

// try read a token, rollback if fail
export function expect(expected: Token['type'] | Token['type'][], input: string, pos: Position) {
  const token = raise(input, pos);
  const types = Array.isArray(expected) ? expected : [expected];

  if (types.indexOf(token.type) === -1) {
    pos.copy(token.pos); // rollback

    throw new Error(`Lexical error, expect "${types.join(',')}", got ${token.type}, pos: ${pos.str()}`);
  }

  return token;
}
