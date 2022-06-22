import * as parse from '@/compile/parse';
import * as scan from '@/compile/scan';

it('parseBinOpExpr', () => {
  const input = '..a b';
  const pos = new scan.Position();
  const expr = parse.parseBinOpExpr(input, pos);

  expect((expr.lhs.master as parse.Id).type).toBe('Id');
  expect((expr.rhs.master as parse.Id).name.source).toBe('b');
});

it('parseBinOpExpr', () => {
  const input = '... a b';
  const pos = new scan.Position();
  const expr = parse.parseUnOpExpr(input, pos);

  expect((expr.value.master as parse.Id).type).toBe('Id');
  expect((expr.value.master as parse.Id).name.source).toBe('a');
});

it('parseDot', () => {
  const input = '.a.b.c';
  const pos = new scan.Position();
  const expr = parse.parseDot(input, pos);

  expect(expr.next?.next).not.toBeUndefined();
  expect(expr.next?.next?.id.name.source).toBe('c');
});

it('parseExpand [x]', () => {
  const input = '[x ]';
  const pos = new scan.Position();
  const expr = parse.parseExpand(input, pos);

  expect((expr.items[0] as parse.Id).name.source).toBe('x');
});

it('parseExpand [ . x]', () => {
  const input = '[ . x]';
  const pos = new scan.Position();
  const expr = parse.parseExpand(input, pos);

  expect((expr.items[0] as scan.Token).source).toBe('.');
  expect((expr.items[1] as parse.Id).name.source).toBe('x');
});

it('parseExpand [ . x ...    y]', () => {
  const input = '[ . x ...    y]';
  const pos = new scan.Position();
  const expr = parse.parseExpand(input, pos);

  expect((expr.items[2] as scan.Token).source).toBe('...');
  expect((expr.items[3] as parse.Id).name.source).toBe('y');
});

it('parseExpand [ . x ...  y[. z]]', () => {
  const input = '[ . x ...  y[. z]]';
  const pos = new scan.Position();
  const expr = parse.parseExpand(input, pos);

  expect(expr.items[4].type).toBe('Expand');

  const nested = expr.items[4] as parse.Expand;

  expect((nested.items[1] as parse.Id).name.source).toBe('z');
});

it('parseAssign "= <id> <expr>"', () => {
  const input = '= x 2';
  const pos = new scan.Position();
  const expr = parse.parseAssign(input, pos);

  expect((expr.variable as parse.Id).name.source).toBe('x');
  expect((expr.assignment.master as parse.Lit).value.source).toBe('2');
});

it('parseAssign "= <expand> <expr>"', () => {
  const input = '= [. x ... [y]] 2';
  const pos = new scan.Position();
  const expr = parse.parseAssign(input, pos);

  expect((expr.variable as parse.Expand).items.length).toBe(4);
  expect((expr.assignment.master as parse.Lit).value.source).toBe('2');
});

it('parseAssign throw', () => {
  expect(() => parse.parseAssign('= 2 2', new scan.Position())).toThrow();
});

it('parseFunc /[] <expr>', () => {
  const input = '/[] 2';
  const pos = new scan.Position();
  const expr = parse.parseFunc(input, pos);

  expect((expr.param as parse.Square).children.length).toBe(0);
  expect((expr.body.master as parse.Lit).value.source).toBe('2');
});

it('parseFunc /<expand> <expr>', () => {
  const input = '/[. x ... [y]] 2';
  const pos = new scan.Position();
  const expr = parse.parseFunc(input, pos);

  expect((expr.param as parse.Expand).items.length).toBe(4);
  expect((expr.body.master as parse.Lit).value.source).toBe('2');
});

it('parseExpr x', () => {
  const input = 'x';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Id');
});

it('parseExpr x.y', () => {
  const input = 'x.y';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Id');
  expect(expr.dot?.id.name.source).toBe('y');
});

it('parseExpr 2', () => {
  const input = '2';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Lit');
});

it('parseExpr \'str\'', () => {
  const input = "'str'";
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Lit');
});

it('parseExpr true', () => {
  const input = 'true';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Lit');
});

it('parseExpr "/[] [.. x y]"', () => {
  const input = '/[] [.. x y]';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Func');
});

it('parseExpr []', () => {
  const input = '[]';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Square');
  expect((expr.master as parse.Square).isEmpty()).toBe(true);
});

it('parseExpr [x].y.z', () => {
  const input = '[x].y.z';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Square');
  expect(((expr.master as parse.Square).children[0] as parse.Expr).master?.type).toBe('Id');
  expect(expr.dot?.next?.id.name.source).toBe('z');
});

it('parseExpr "[... [.. x y]]"', () => {
  const input = '[... [.. x y]]';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect((expr.master as parse.Square).children[0].type).toBe('UnOpExpr');
});

it('parseExpr [/[. x] [.. x y]]', () => {
  const input = '[/[. x] [.. x y]]';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Square');
  expect(((expr.master as parse.Square).children[0] as parse.Expr)?.master.type).toBe('Func');
});

it('parseExpr [/ [... x] [.. x y]]', () => {
  const input = '[/ [... x] [.. x y]]';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);

  expect(expr.master.type).toBe('Square');
  expect(((expr.master as parse.Square).children[0] as parse.Expr)?.master.type).toBe('BinOpExpr');
});

it('parseExpr [/[2 x] [.. x y] [= z 2]]', () => {
  const input = '[/[2 x] [.. x y] [= z 2]]';
  const pos = new scan.Position();
  const expr = parse.parseExpr(input, pos);
  const square = expr.master as parse.Square;

  expect(square.type).toBe('Square');
  expect((square.children[0] as parse.Expr)?.master.type).toBe('Func');
  expect(((square.children[1] as parse.Expr)?.master as parse.Square).children[0].type).toBe('Assign');
});