// 十进制转原码表示，保留符号
const dig2x = (radix: number) => (dig: string) => {
  const num = Number(dig);
  if (!Number.isInteger(num)) {
    throw new Error(`Expect unsigned int, got ${num}`);
  }

  return Number(num).toString(radix);
};

export const d2h = dig2x(16);
export const d2b = dig2x(2);

// 原码转十进制，保留符号
const x2dig = (prefix: string) => (str: string) => {
  const neg = str.startsWith('-');
  const int = Number(`${prefix}${neg ? str.slice(1) : str}`);

  if (Number.isNaN(int)) {
    throw new Error(`Expect valid number, got ${str}`);
  }

  return neg ? String(-int) : String(int);
};

export const h2d = x2dig('0x');
export const b2d = x2dig('0b');

export const isNegative = (dig: string|string[]) => dig[0] === '-';

// 原码
export const d2o = (dig: string, n = 8) => {
  const num = Number(dig);

  if (num <= -(2 ** (n - 1))) {
    throw new Error(`Negative overflow for dig2origin: ${num}`);
  }

  if (num >= (2 ** (n - 1))) {
    throw new Error(`Positive overflow for dig2origin: ${num}`);
  }

  const array = d2b(dig).split('');

  // 负数前面有'-'，正数前面没有，array长度不同
  if (isNegative(dig)) {
    array.splice(0, 1, '1');
  } else {
    array.splice(0, 0, '0');
  }

  while (array.length < n) array.splice(1, 0, '0');

  return array.join('');
};

export const o2d = (bin: string) => {
  return bin[0] === '1'
    ? String(-Number(b2d(bin.slice(1))))
    : b2d(bin.slice(1));
};

// 移码
export const d2s = (dig: string, bias: number) => {
  return d2b(String(Number(dig) + bias));
};

export const s2d = (bin: string, bias: number) => {
  return String(Number(b2d(bin)) - bias);
};

// 补码
export const d2c = (dig: string, n = 8) => {
  const num = Number(dig);

  if (num < -(2 ** (n - 1))) {
    throw new Error(`Negative overflow for dig2complement: ${num}`);
  }

  if (num >= (2 ** (n - 1))) {
    throw new Error(`Positive overflow for dig2complement: ${num}`);
  }

  return isNegative(dig)
    ? d2b(String(2 ** n + num))
    : d2o(String(num), n);
};

export const c2d = (bin: string, n = 8) => {
  if (bin.length < n) {
    throw new Error(`Bit length is too short, expect ${n}, got ${bin.length}`);
  }

  return bin[0] === '1'
    ? String(Number(b2d(bin)) - 2 ** n)
    : b2d(bin);
};
