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
    return { ...this };
  }
}

export type Token = {
  type: 'str' | 'num' | 'bool' | 'id' | 'comment' | 'eof' | '.' | '..' | '...' | ';' | '[' | ']' | '/' | '=';
  source: string;
  pos: Position;
};

const makeToken = (type: Token['type'], pos: Position, source: string): Token => {
  const clone = pos.clone();

  pos.column += source.length;
  pos.cursor += source.length;

  return {
    type,
    pos: clone,
    source,
  };
};

export function readToken(input: string, pos: Position): Token {
  if (pos.cursor >= input.length) return { type: 'eof', pos, source: 'eof' };

  const pivot = input[pos.cursor];

  if (/'/.test(pivot)) { return readString(input, pos); }
  if (/[0-9]/.test(pivot)) { return readNumber(input, pos); }
  if (/[a-zA-Z_]/.test(pivot)) { return readIdentifier(input, pos); }
  if (/\./.test(pivot)) { return readDot(input, pos); }
  if (/;/.test(pivot)) { return readComment(input, pos); }

  switch (pivot) {
    case '[':
    case ']':
    case '/':
    case '=':
      return makeToken(pivot, pos, pivot);
    default:
      throw new Error(`Unexpected character: ${pivot}`);
  }
}

const STRING_REGEX = /^'(?:[^'\\\n\r]|\\')*'/;
export function readString(input: string, pos: Position): Token {
  const match = STRING_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken('str', pos, match[0]);
  }

  throw new Error(`Unexpected string at ${pos.cursor}`);
}

const NUMBER_REGEX = /^\d+(?:\.\d+)?(?:e\d+)?/;
export function readNumber(input: string, pos: Position): Token {
  const match = NUMBER_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken('num', pos, match[0]);
  }

  throw new Error(`Unexpected number at ${pos.cursor}`);
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

  throw new Error(`Unrecognized identifier at ${pos.cursor}`);
}

const DOT_REGEX = /^(?:\.\.\.|\.\.|\.)/;
export function readDot(input: string, pos: Position): Token {
  const match = DOT_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken(match[0] as '.' | '..' | '...', pos, match[0]);
  }

  throw new Error(`Unexpected dot at ${pos.cursor}`);
}

const COMMENT_TOKEN_REGEX = /^;([^;\\\r\n]|\\;)*;?/;
export function readComment(input: string, pos: Position): Token {
  const match = COMMENT_TOKEN_REGEX.exec(input.slice(pos.cursor));

  if (match) {
    return makeToken('comment', pos, match[0]);
  }

  throw new Error(`Unexpected comment at ${pos.cursor}`);
}

// !!! side effect
export function skipWhitespace(input: string, pos: Position) {
  while (true) {
    if (/ |\t/.test(input[pos.cursor])) {
      pos.cursor++;
      pos.column++;
    } else if (/^\r\n/.test(input.slice(pos.cursor))) { // \r\n first
      pos.cursor += 2;
      pos.row += 1;
      pos.column = 0;
    } else if (/\n|\r/.test(input[pos.cursor])) {
      pos.cursor += 1;
      pos.row += 1;
      pos.column = 0;
    } else {
      break;
    }
  }

  return pos;
}
