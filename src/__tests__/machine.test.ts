import { Machine } from '../SICP/machine';

it('test add', done => {
  const machine = new Machine(
    ['a', 'b'],
    [
      ['+', (x: number, y: number) => x + y],
      [
        'display',
        result => {
          expect(result).toBe(3);
          done();
        },
      ],
    ],
    [
      ['assign', 'a', ['const', 1]],
      ['assign', 'b', ['const', 2]],
      ['assign', 'a', ['op', '+'], ['reg', 'a'], ['reg', 'b']],
      ['perform', ['op', 'display'], ['reg', 'a']],
    ],
  );

  machine.start();
});

it('test label', done => {
  const machine = new Machine(
    ['x'],
    [
      ['>=', (x: number, y: number) => x >= y],
      ['+', (x: number, y: number) => x + y],
      [
        'display',
        result => {
          expect(result).toBe(5);
          done();
        },
      ],
    ],
    // loop until x+=2 >= 4
    [
      ['assign', 'x', ['const', 1]],
      Symbol('loop'),
      ['test', ['op', '>='], ['reg', 'x'], ['const', 4]],
      ['branch', ['label', 'end']],
      ['assign', 'x', ['op', '+'], ['reg', 'x'], ['const', 2]],
      ['goto', ['label', 'loop']],
      Symbol('end'),
      ['perform', ['op', 'display'], ['reg', 'x']],
    ],
  );

  machine.start();
});

it('test gcd', done => {
  const machine = new Machine(
    ['a', 'b', 't'],
    [
      ['%', (x: number, y: number) => x % y],
      ['=', (x: number, y: number) => x === y],
      [
        'display',
        result => {
          expect(result).toBe(4);
          done();
        },
      ],
    ],
    [
      ['assign', 'a', ['const', 12]],
      ['assign', 'b', ['const', 8]],
      Symbol('test-b'),
      ['test', ['op', '='], ['reg', 'b'], ['const', 0]],
      ['branch', ['label', 'gcd-done']],
      ['assign', 't', ['op', '%'], ['reg', 'a'], ['reg', 'b']],
      ['assign', 'a', ['reg', 'b']],
      ['assign', 'b', ['reg', 't']],
      ['goto', ['label', 'test-b']],
      Symbol('gcd-done'),
      ['perform', ['op', 'display'], ['reg', 'a']],
    ],
  );

  machine.start();
});

it('test fact', done => {
  const machine = new Machine(
    ['continue', 'n', 'val'],
    [
      ['=', (x: number, y: number) => x === y],
      ['-', (x: number, y: number) => x - y],
      ['*', (x: number, y: number) => x * y],
      [
        'display',
        result => {
          expect(result).toBe(24);
          done();
        },
      ],
    ],
    [
      ['assign', 'n', ['const', 4]],
      ['assign', 'continue', ['label', 'done']],
      Symbol('down'),
      ['test', ['op', '='], ['reg', 'n'], ['const', 1]],
      ['branch', ['label', 'boundary']],
      ['save', 'continue'],
      ['save', 'n'],
      ['assign', 'n', ['op', '-'], ['reg', 'n'], ['const', 1]],
      ['assign', 'continue', ['label', 'up']],
      ['goto', ['label', 'down']],
      Symbol('up'),
      ['restore', 'n'],
      ['restore', 'continue'],
      ['assign', 'val', ['op', '*'], ['reg', 'n'], ['reg', 'val']],
      ['goto', ['reg', 'continue']],
      Symbol('boundary'),
      ['assign', 'val', ['const', 1]],
      ['goto', ['reg', 'continue']],
      Symbol('done'),
      ['perform', ['op', 'display'], ['reg', 'val']],
    ],
  );

  machine.start();
});

it('test fib', done => {
  const machine = new Machine(
    ['n', 'val', 'tmp', 'continue'],
    [
      ['=', (x: number, y: number) => x === y],
      ['+', (x: number, y: number) => x + y],
      ['-', (x: number, y: number) => x - y],
      [
        'display',
        result => {
          expect(result).toBe(13);
          done();
        },
      ],
    ],
    [
      ['assign', 'n', ['const', 6]],
      ['assign', 'continue', ['label', 'done']],
      Symbol('down'),
      ['test', ['op', '='], ['reg', 'n'], ['const', 0]],
      ['branch', ['label', 'fib0']],
      ['save', 'continue'],
      ['assign', 'n', ['op', '-'], ['reg', 'n'], ['const', 1]],
      ['assign', 'continue', ['label', 'up']],
      ['goto', ['label', 'down']],
      Symbol('up'),
      ['restore', 'continue'],
      ['assign', 'tmp', ['op', '+'], ['reg', 'val'], ['reg', 'n']],
      ['assign', 'n', ['reg', 'val']],
      ['assign', 'val', ['reg', 'tmp']],
      ['goto', ['reg', 'continue']],
      Symbol('fib0'),
      ['assign', 'val', ['const', 1]],
      ['goto', ['reg', 'continue']],
      Symbol('done'),
      ['perform', ['op', 'display'], ['reg', 'val']],
    ],
  );

  machine.start();
});
