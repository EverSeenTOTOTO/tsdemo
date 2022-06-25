import path from 'path';
import { parse, evaluate, createGlobalEnv } from '@/compile/';

it('parse 1', () => {
  const input = `
  [match a
      [[and [> q a] [< p a]] foo]
        [[[regex '[a-z]+' 'g'].test a] [bar]]]
        `;
  expect(() => parse(input)).not.toThrow();
});

it('parse 2', () => {
  const input = `
[loop [= i 0] [< i 10] 
  [if [= [. i] 0]
    [continue]
    [log i]]]
        `;
  expect(() => parse(input)).not.toThrow();
});

it('parse 3', () => {
  const input = `
[= fib /[n]   
  [match n 
    [[in 0 1] 1]
    [! [+ 
      [fib [- n 1]] 
      [fib [- n 2]]]]]]
        `;
  expect(() => parse(input)).not.toThrow();
});

it('parse 4', () => {
  const input = `
[import [program] 'commander']
[import open 'open']
[import [createServer] './dist/server']
[import [version] './package.json']

[program.version version]
[program.option '-p, --port <port>' 'port' 3000]

[= opts [program.opts]]

[= program [createServer opts]]
[program.then /[port options] [begin
    [options.logger.done 'Server started on port ' port]
    [if opts.open
      [open 'http://localhost:' port]
    ]]]
[program.catch /[e] [console.error e.stack]]
    `;
  expect(() => parse(input)).not.toThrow();
});

it('parse 6', () => {
  const input = `
[= stack /[vec] [begin 
  [= s [Object]]
  [= s.vec vec]
  [= s.push /[x] [= s.vec [.. s.vec [x]]]]
  [= s.pop /[] [begin
    [= [... x] s.vec]
    [s.vec.splice [- s.vec.length 1] 1]
    x]]
  s]]

[= s [stack [1 2 3]]]
[s.push 2]
[= a [s.pop]]

[= v [1 2 3]]
[= v [.. v [2]]]
[map v /[x] [+ x 1]]
[map v /[x idx] [+ x idx]]

; line comment
[= o [obj 1 [obj 2 3]]]
[log o.a]
[log o.b.b]
[o.log]
    `;
  expect(() => parse(input)).not.toThrow();
});

it('evaluate 1', () => {
  const code = `[= a 'foo']
  [= b 2]
  [= c [.. 1 10]]
  [= [. [x] y] [1 [2] 3]]
  `;

  const { env } = evaluate(code);

  expect(env.get('a')).toBe('foo');
  expect(env.get('b')).toBe(2);
  expect(env.get('c')).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  expect(env.get('x')).toBe(2);
  expect(env.get('y')).toBe(3);
});

it('evaluate 2', () => {
  const code = `
[= foo /[x y] [== x y]]

[foo 1 2]

[process.cwd]

[/[] process.arch]

[console.log [/[] process].argv]

[[require 'os'].cpus].length
`;

  const { result } = evaluate(code, createGlobalEnv());
  expect(result).toEqual([
    undefined,
    false,
    process.cwd(),
    process.arch,
    undefined,
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    require('os').cpus().length,
  ]);
});

it('evaluate 3', async () => {
  const code = `
[[import 'path'].then /[path] [path.resolve '.']]
`;
  const result = await Promise.all(evaluate(code, createGlobalEnv()).result);

  expect(result).toEqual([
    path.resolve('.'),
  ]);
});

it('evaluate 4', () => {
  const code = `
[if true true false]
[if false true false]
[if false any]
`;
  const { result } = evaluate(code);

  expect(result).toEqual([
    true,
    false,
    undefined,
  ]);

  expect(() => evaluate('[if ]')).toThrow();
  expect(() => evaluate('[if true]')).toThrow();
  expect(() => evaluate('[if true true false extra]')).toThrow();
});

it('evaluate 5', () => {
  const code = `
[begin 1 2]
[begin [= x 1] [= y 2] [begin [+ x y]]]
`;
  const { result } = evaluate(code);

  expect(result).toEqual([
    2,
    3,
  ]);
});

it('evaluate 6', () => {
  const code = `
[begin [= i 1] [while [< i 4] [+= i 1]] i]
`;
  const { result } = evaluate(code);

  expect(result).toEqual([4]);
});

it('evaluate 7', () => {
  const code = `
[match true]
[begin 
  [= x 2]
  [match x
    [1 1]
    [2 2]]]
[begin 
  [= y 'str']
  [match y
    ['s' 's']
    [[/[] 'st'] 'st']]]
`;

  const { result } = evaluate(code);

  expect(result).toEqual([undefined, 2, undefined]);
});

it('evaluate 8', () => {
  const code = `
[= o [Object]]
[= o.a 1]
[= o.b o]
[= o.b.c 2]
[^= o.c o.c]

[o.a o.c]
`;

  const { result } = evaluate(code, createGlobalEnv());

  expect(result[result.length - 1]).toEqual([1, 4]);
});

it('evaluate 9', () => {
  const code = `
[= stack /[vec] [begin 
  [= this [Object]]
  [= this.vec [... vec]]
  [= this.clear /[] [= this.vec []]]
  [= this.push /[x] [begin 
    [= this.vec [.. this.vec [x]]]]]
  [= this.pop /[] [begin
    [= [... x] this.vec]
    [this.vec.splice [- this.vec.length 1] 1]
    x]]
  this]]

[= v [1 2 3]]
[= s [stack v]]
[= x [s.pop]]
[s.clear]
[s.push 1]
[s.push 0]
[= y [s.pop]]

[x y v]
    `;

  const { result } = evaluate(code, createGlobalEnv());

  expect(result[result.length - 1]).toEqual([3, 0, [1, 2, 3]]);
});
