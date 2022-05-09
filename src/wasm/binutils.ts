const dig2x = (radix = 16) => (dig: string) => {
  const num = Number(dig);
  if (!Number.isInteger(num)) {
    throw new Error(`Expect a unsigned int, got ${num}`);
  }

  return Number(num).toString(radix);
};

export const dig2hex = dig2x(16);
export const dig2bin = dig2x(2);

const x2dig = (prefix = '0x') => (str: string) => {
  const neg = str.startsWith('-');
  const int = Number(`${prefix}${neg ? str.slice(1) : str}`);

  if (Number.isNaN(int)) {
    throw new Error(`Expect hex string, got ${str}`);
  }

  return neg ? String(-int) : String(int);
};

export const hex2dig = x2dig('0x');
export const bin2dig = x2dig('0b');

export const isNegtive = (dig: string|string[]) => dig[0] === '-';

// 原码
export const dig2origin = (dig: string, n = 8) => {
  const array = dig2bin(dig).split('');

  if (isNegtive(dig)) {
    array.splice(0, 1, '1');
  } else {
    array.splice(0, 0, '0');
  }

  if (array.length > n) {
    throw new Error(`Integer oveflow, expect ${(-2) ** (n - 1) + 1} <= x <= ${2 ** (n - 1) - 1}, got ${dig}`);
  }

  while (array.length < n) array.splice(1, 0, '0');

  return array.join('');
};

export const dig2shift = (dig: string, bias: number) => {
  return dig2bin(String(Number(dig) + bias));
};

// 补码
export const dig2complement = (dig: string, n = 8) => {
  const num = Number(dig);
  const min = (-2) ** (n - 1);

  if (num < min) {
    throw new Error(`Integer oveflow, expect x >= ${min}, got ${num}`);
  }

  return !isNegtive(dig)
    ? dig2origin(dig, n)
    // mod 2^n
    : dig2origin(String(2 ** n - (-Number(dig))), n + 1).slice(1);
};

export const int2uint = (dig: string, n = 8) => bin2dig(dig2complement(dig, n));
export const uint2int = (dig: string, n = 8) => {
  if (isNegtive(dig)) {
    throw new Error(`Expect unsigned int, got ${dig}`);
  }

  const str = dig2origin(dig, n + 1);

  // elimilate n+1
  if (str[0] === '1') {
    throw new Error(`Integer oveflow, expect x <= ${2 ** n - 1}, got ${dig}`);
  }

  return str[1] === '1'
    // mod 2^n
    ? String(-(2 ** n - Number(bin2dig(str.slice(1)))))
    : bin2dig(str.slice(1));
};
