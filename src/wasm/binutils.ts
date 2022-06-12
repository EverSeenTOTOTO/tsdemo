// 十进制转原码表示，保留符号
const dig2x = (radix: number) => (dig: string) => {
  const num = Number(dig);
  if (!Number.isInteger(num)) {
    throw new Error(`Expect unsigned int, got ${num}`);
  }

  return Number(num).toString(radix);
};

export const dig2hex = dig2x(16);
export const dig2bin = dig2x(2);

// 原码转十进制，保留符号
const x2dig = (prefix: string) => (str: string) => {
  const neg = str.startsWith('-');
  const int = Number(`${prefix}${neg ? str.slice(1) : str}`);

  if (Number.isNaN(int)) {
    throw new Error(`Expect hex string, got ${str}`);
  }

  return neg ? String(-int) : String(int);
};

export const hex2dig = x2dig('0x');
export const bin2dig = x2dig('0b');

export const isNegative = (dig: string|string[]) => dig[0] === '-';

// 原码
export const dig2origin = (dig: string, n = 8) => {
  const num = Number(dig);

  if (num <= -(2 ** (n - 1))) {
    throw new Error(`Negative overflow for dig2origin: ${num}`);
  }

  if (num >= (2 ** (n - 1))) {
    throw new Error(`Positive overflow for dig2origin: ${num}`);
  }

  const array = dig2bin(dig).split('');

  // 负数前面有'-'，正数前面没有，array长度不同
  if (isNegative(dig)) {
    array.splice(0, 1, '1');
  } else {
    array.splice(0, 0, '0');
  }

  while (array.length < n) array.splice(1, 0, '0');

  return array.join('');
};

// 移码
export const dig2shift = (dig: string, bias: number) => {
  return dig2bin(String(Number(dig) + bias));
};

// 补码
export const dig2complement = (dig: string, n = 8) => {
  const num = Number(dig);

  if (num < -(2 ** (n - 1))) {
    throw new Error(`Negative overflow for dig2complement: ${num}`);
  }

  if (num >= (2 ** (n - 1))) {
    throw new Error(`Positive overflow for dig2complement: ${num}`);
  }

  return isNegative(dig)
    ? dig2bin(String(2 ** n + num))
    : dig2origin(String(num), n);
};

// 将int强行解释为uint
export const int2uint = (dig: string, n = 8) => bin2dig(dig2complement(dig, n));
// 将uint强行解释为int
export const uint2int = (dig: string, n = 8) => {
  if (isNegative(dig)) {
    throw new Error(`Expect unsigned int, got ${dig}`);
  }

  const str = dig2origin(dig, n + 1);

  return str[1] === '1' // 符号位1解释为负数
    ? String(-(2 ** n - Number(bin2dig(str.slice(1))))) // 原负数+2^n=X，原负数=X-2^n
    : bin2dig(str.slice(1));
};
