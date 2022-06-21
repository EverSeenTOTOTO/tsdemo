import * as scan from '@/compile/scan';

it('skipWhitespace', () => {
  expect(scan.skipWhitespace('', new scan.Position())).toEqual({
    row: 0,
    column: 0,
    cursor: 0,
  });
  expect(scan.skipWhitespace(' ', new scan.Position())).toEqual({
    row: 0,
    column: 1,
    cursor: 1,
  });
  expect(scan.skipWhitespace('\t', new scan.Position())).toEqual({
    row: 0,
    column: 1,
    cursor: 1,
  });
  expect(scan.skipWhitespace('\n\r', new scan.Position())).toEqual({
    row: 2,
    column: 0,
    cursor: 2,
  });
  expect(scan.skipWhitespace('\r\n', new scan.Position())).toEqual({
    row: 1,
    column: 0,
    cursor: 2,
  });
  expect(scan.skipWhitespace(' \t\t ', new scan.Position())).toEqual({
    row: 0,
    column: 4,
    cursor: 4,
  });
  expect(scan.skipWhitespace(' \n \n\t\r\n\t\n ', new scan.Position())).toEqual({
    row: 4,
    column: 1,
    cursor: 10,
  });
  expect(scan.skipWhitespace('a ', new scan.Position())).toEqual({
    row: 0,
    column: 0,
    cursor: 0,
  });
  expect(scan.skipWhitespace(' a ', new scan.Position())).toEqual({
    row: 0,
    column: 1,
    cursor: 1,
  });
});

it('readString', () => {
  expect(scan.readString("''", new scan.Position()).source).toBe("''");
  expect(scan.readString("'\\''", new scan.Position()).source).toBe("'\\''");
  expect(scan.readString("'str'", new scan.Position()).source).toBe("'str'");
  expect(() => scan.readString("'str\nstr'", new scan.Position())).toThrow();
});

it('readNumber', () => {
  expect(scan.readNumber('00', new scan.Position()).source).toBe('00');
  expect(scan.readNumber('01.11', new scan.Position()).source).toBe('01.11');
  expect(scan.readNumber('1.1.1', new scan.Position()).source).toBe('1.1');
  expect(scan.readNumber('01e11', new scan.Position()).source).toBe('01e11');
  expect(scan.readNumber('01.11e7', new scan.Position()).source).toBe('01.11e7');
  expect(scan.readNumber('1e7.1', new scan.Position()).source).toBe('1e7');
  expect(() => scan.readNumber('.1', new scan.Position())).toThrow();
  expect(() => scan.readNumber('e7', new scan.Position())).toThrow();
});

it('readIdentifier', () => {
  expect(scan.readIdentifier('id', new scan.Position()).source).toBe('id');
  expect(scan.readIdentifier('_', new scan.Position()).source).toBe('_');
  expect(scan.readIdentifier('_0', new scan.Position()).source).toBe('_0');
  expect(scan.readIdentifier('true', new scan.Position()).type).toBe('bool');
  expect(scan.readIdentifier('false', new scan.Position()).type).toBe('bool');
  expect(scan.readIdentifier('_0', new scan.Position()).source).toBe('_0');
  expect(() => scan.readIdentifier('0_', new scan.Position())).toThrow();
});

it('readDot', () => {
  expect(scan.readDot('.', new scan.Position()).source).toBe('.');
  expect(scan.readDot('..', new scan.Position()).source).toBe('..');
  expect(scan.readDot('...', new scan.Position()).source).toBe('...');
  expect(scan.readDot('....', new scan.Position()).source).toBe('...');
  expect(scan.readDot('.. ..', new scan.Position()).source).toBe('..');
  expect(() => scan.readDot('\\..', new scan.Position())).toThrow();
});

it('readComment', () => {
  expect(scan.readComment(';', new scan.Position()).source).toBe(';');
  expect(scan.readComment(';..', new scan.Position()).source).toBe(';..');
  expect(scan.readComment(';.\\;..', new scan.Position()).source).toBe(';.\\;..');
  expect(scan.readComment(';..;..', new scan.Position()).source).toBe(';..;');
  expect(scan.readComment(';..\\; ..;.', new scan.Position()).source).toBe(';..\\; ..;');
  expect(scan.readComment(';..\\;\n ..;.', new scan.Position()).source).toBe(';..\\;');
  expect(() => scan.readComment('\\;;', new scan.Position())).toThrow();
});

it('readToken', () => {
  const source = `
[export SimpleQeuue/[watcher [= interval 300] ;queue name; [= name 'q']]
  [dispatch/[] [...]]
`;
  const pos = new scan.Position();

  scan.skipWhitespace(source, pos);

  expect(pos.row).toBe(1);
  expect(pos.column).toBe(0);
  expect(pos.cursor).toBe(1);

  expect(scan.readToken(source, pos).source).toBe('[');

  scan.skipWhitespace(source, pos);
  expect(scan.readToken(source, pos).source).toBe('export');

  scan.skipWhitespace(source, pos);

  let token = scan.readToken(source, pos);

  expect(token.source).toBe('SimpleQeuue');
  expect(token.pos.column).toBe(8);
  expect(token.pos.cursor).toBe(9);
  expect(pos.column).toBe(19);
  expect(pos.cursor).toBe(20);

  while (token.type !== 'eof') {
    scan.skipWhitespace(source, pos);
    token = scan.readToken(source, pos); // [
  }

  expect(pos.row).toBe(3);
  expect(pos.column).toBe(0);
  expect(pos.cursor).toBe(source.length);
});
