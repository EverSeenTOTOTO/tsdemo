/* eslint-disable no-bitwise */
import { repeat } from '@/utils';
import {
  b2d,
  c2d,
  d2b,
  d2c,
  d2h,
  d2o,
  d2s,
  h2d,
  o2d,
  s2d,
} from '@/bin/binutils';

it('test dig2hex', () => {
  expect(d2h('0')).toBe('0');
  expect(d2h('01')).toBe('1');
  expect(d2h('15')).toBe('f');
  expect(d2h('16')).toBe('10');
  expect(d2h('-1')).toBe('-1');
  expect(d2h('-01')).toBe('-1');
  expect(d2h('-16')).toBe('-10');

  expect(() => d2h('1.1')).toThrow();

  // 0xffffffff
  expect(d2h(String(2 ** 32 - 1)).length).toBe(8);
});

it('test dig2bin', () => {
  expect(d2b('0')).toBe('0');
  expect(d2b('15')).toBe('1111');
  expect(d2b('16')).toBe('10000');
  expect(d2b('-1')).toBe('-1');
  expect(d2b('-16')).toBe('-10000');
  expect(d2b('127')).toBe('1111111');
  expect(d2b('-127')).toBe('-1111111');

  expect(() => d2b('1.1')).toThrow();

  expect(d2b(String(2 ** 32 - 1)).length).toBe(32);
});

it('test hex2dig', () => {
  expect(h2d('f')).toBe('15');
  expect(h2d('11')).toBe('17');
  expect(h2d('-11')).toBe('-17');

  expect(() => h2d('1.1')).toThrow();

  expect(h2d('ffffffff')).toBe(String(2 ** 32 - 1));
});

it('test bin2dig', () => {
  expect(b2d('1111')).toBe('15');
  expect(b2d('11')).toBe('3');
  expect(b2d('-11')).toBe('-3');
  expect(b2d('1111111')).toBe('127');
  expect(b2d('-1111111')).toBe('-127');

  expect(() => b2d('1.1')).toThrow();

  // eslint-disable-next-line prefer-spread
  expect(b2d(repeat('1', 32).join(''))).toBe(String(2 ** 32 - 1));
});

it('test dig2origin', () => {
  expect(d2o('0')).toBe('00000000');
  expect(d2o('-2')).toBe('10000010');
  expect(d2o('-127')).toBe('11111111');
  expect(d2o('127')).toBe('01111111');

  expect(() => d2o('-128')).toThrow(/Negative overflow/);
  expect(() => d2o('128')).toThrow(/Positive overflow/);
});

test('test origin2dig', () => {
  expect(o2d('00000000')).toBe('0');
  expect(o2d('10000000')).toBe('0');
  expect(o2d('10000010')).toBe('-2');
  expect(o2d('11111111')).toBe('-127');
  expect(o2d('01111111')).toBe('127');
});

it('test dig2shift', () => {
  expect(d2s('-1', 8)).toBe(d2b('7'));
  expect(d2s('-8', 8)).toBe(d2b('0'));
  expect(d2s('1', 8)).toBe(d2b('9'));
});

it('test shift2dig', () => {
  expect(s2d('111', 8)).toBe('-1');
  expect(s2d('0', 8)).toBe('-8');
  expect(s2d('1001', 8)).toBe('1');
});

it('test dig2complement', () => {
  expect(d2c('0')).toBe('00000000');
  expect(d2o('32')).toBe(d2c('32'));
  expect(d2c('-1')).toBe('11111111');
  expect(d2c('-123')).toBe('10000101');
  expect(d2c('127')).toBe('01111111');
  expect(d2c('-128')).toBe('10000000');

  expect(() => d2c('128')).toThrow(/Positive overflow/);
  expect(() => d2c('-129')).toThrow(/Negative overflow/);
});

it('test dig2complement', () => {
  expect(c2d('00000000')).toBe('0');
  expect(c2d(d2c('32'))).toBe('32');
  expect(c2d('11111111')).toBe('-1');
  expect(c2d('10000101')).toBe('-123');
  expect(c2d('01111111')).toBe('127');
  expect(c2d('10000000')).toBe('-128');
});

it('test uint2int', () => {
  expect(c2d(d2b('128'))).toBe('-128');
  expect(c2d(d2b('255'))).toBe('-1');
  // d2b('127') is '1111111', no leading '0'
  expect(c2d('01111111')).toBe('127');
});

it('test int2uint', () => {
  expect(b2d(d2c('-128'))).toBe('128');
  expect(b2d(d2c('-1'))).toBe('255');
  expect(b2d(d2c('127'))).toBe('127');
});

it('test fused', () => {
  expect(d2b(String(~0xf))).toBe('-10000');

  // x的最高4个有效字节不变，其余各位全变位0
  expect(
    d2b(
      String(
        (Number(b2d('11111111')) >> 4) << 4,
      ),
    ),
  ).toBe('11110000');

  // x的最低4个有效字节不变，其余各位全变位0
  expect(
    d2b(
      String(
        Number(b2d('11111111')) & 0xf,
      ),
    ),
  ).toBe('1111');

  // x的最低4个有效字节全变1,其余各位不变
  expect(
    d2b(
      String(
        Number(b2d('10101010')) | 0xf,
      ),
    ),
  ).toBe('10101111');

  // x的最低4个有效字节全变位0，其余各位取反
  expect(
    d2c(
      String(
        ((Number(b2d('10101010')) ^ (~0xf)) >> 4) << 4,
      ),
      16,
    ),
  ).toBe('1111111101010000');
});
