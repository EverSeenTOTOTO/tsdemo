import { Machine } from '../SICP/machine';

describe('test machine', () => {
  let result: number|undefined;
  const display = (x: number) => {
    result = x;
    // console.log(result);
  };

  it('test add', () => {
    const machine = new Machine(
      ['a', 'b'],
      [
        [
          '+',
          (x: number, y: number) => x + y,
        ],
        [
          'display',
          display,
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

    expect(result).toBe(3);
  });

  it('test label', () => {
    const machine = new Machine(
      ['x'],
      [
        ['>=', (x: number, y: number) => x >= y],
        ['+', (x: number, y: number) => x + y],
        ['display', display],
      ],
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
    expect(result).toBe(5);
  });

  it('test gcd', () => {
    const machine = new Machine(
      ['a', 'b', 't'],
      [
        [
          '%',
          (x: number, y: number) => (x % y),
        ],
        [
          '=',
          (x: number, y: number) => x === y,
        ],
        ['display', display],
      ],
      [
        ['assign', 'a', ['const', 12]],
        ['assign', 'b', ['const', 8]],
        Symbol('test-b'),
        ['test', ['op', '='], ['reg', 'b'], ['const', 0]],
        ['branch', ['label', 'gcd-done']],
        ['assign', 't', ['op', '%'], ['reg', 'a'], ['reg', 'b']],
        ['perform', ['op', 'display'], ['reg', 'b']],
        ['assign', 'a', ['reg', 'b']],
        ['assign', 'b', ['reg', 't']],
        ['goto', ['label', 'test-b']],
        Symbol('gcd-done'),
      ],
    );

    machine.start();

    expect(result).toBe(4);
  });

  it('test fact', () => {
    const machine = new Machine(
      ['continue', 'n', 'val'],
      [
        ['=', (x: number, y: number) => x === y],
        ['-', (x: number, y: number) => x - y],
        ['*', (x: number, y: number) => x * y],
        ['display', display],
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

    expect(result).toBe(24);
  });

  it('test fib', () => {
    const machine = new Machine(
      ['n', 'val', 'tmp', 'continue'],
      [
        ['=', (x: number, y: number) => x === y],
        ['+', (x: number, y: number) => x + y],
        ['-', (x: number, y: number) => x - y],
        ['display', display],
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

    expect(result).toBe(13);
  });
});
