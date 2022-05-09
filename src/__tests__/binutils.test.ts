import {
  bin2dig,
  dig2bin,
  dig2hex,
  hex2dig,
  int2uint,
  uint2int,
  dig2origin,
  dig2complement,
} from '@/wasm/binutils';

describe('test binutils', () => {
  it('test dig2hex', () => {
    expect(dig2hex('0')).toBe('0');
    expect(dig2hex('15')).toBe('f');
    expect(dig2hex('16')).toBe('10');
    expect(dig2hex('-1')).toBe('-1');
    expect(dig2hex('-16')).toBe('-10');
    expect(() => dig2hex('1.1')).toThrow();

    // 0xffffffff
    expect(dig2hex(String(2 ** 32 - 1)).length).toBe(8);
  });

  it('test dig2bin', () => {
    expect(dig2bin('0')).toBe('0');
    expect(dig2bin('15')).toBe('1111');
    expect(dig2bin('16')).toBe('10000');
    expect(dig2bin('-1')).toBe('-1');
    expect(dig2bin('-16')).toBe('-10000');
    expect(() => dig2bin('1.1')).toThrow();

    expect(dig2bin(String(2 ** 32 - 1)).length).toBe(32);
  });

  it('test hex2dig', () => {
    expect(hex2dig('f')).toBe('15');
    expect(hex2dig('11')).toBe('17');
    expect(hex2dig('-11')).toBe('-17');
    expect(() => hex2dig('1.1')).toThrow();

    expect(hex2dig('ffffffff')).toBe(String(2 ** 32 - 1));
  });

  it('test bin2dig', () => {
    expect(bin2dig('1111')).toBe('15');
    expect(bin2dig('11')).toBe('3');
    expect(bin2dig('-11')).toBe('-3');
    expect(() => bin2dig('1.1')).toThrow();

    // eslint-disable-next-line prefer-spread
    expect(bin2dig(Array.apply(null, { length: 32 }).map(() => '1').join(''))).toBe(String(2 ** 32 - 1));
  });

  it('test dig2origin', () => {
    expect(dig2origin('0')).toBe('00000000');
    expect(dig2origin('-2')).toBe('10000010');
    expect(dig2origin('-127')).toBe('11111111');
    expect(dig2origin('127')).toBe('01111111');

    expect(() => dig2origin('-128')).toThrow();
    expect(() => dig2origin('128')).toThrow();
  });

  it('test dig2complement', () => {
    expect(dig2complement('0')).toBe('00000000');
    expect(dig2origin('32')).toBe(dig2complement('32'));
    expect(dig2complement('-1')).toBe('11111111');
    expect(dig2complement('-123')).toBe('10000101');
    expect(() => dig2complement('127')).not.toThrow();
    expect(() => dig2complement('128')).toThrow();
    expect(() => dig2complement('-128')).not.toThrow();
    expect(() => dig2complement('-129')).toThrow();
  });

  it('test mixed', () => {
    // int -> complement -> explain as uint
    expect(int2uint('-1')).toBe('255');
    expect(int2uint('-128')).toBe('128');

    expect(uint2int('255')).toBe('-1');
    expect(uint2int('128')).toBe('-128');

    expect(() => uint2int('-1')).toThrow();
  });
});
