type ThrowNeedleTest ={
  l: number, // 针的长度
  d: number, // 平行线之间的距离
  times: number // 实验次数
};

function randomBetween(min: number, max: number) {
  const step = max - min;

  return Math.random() * step + min;
}
const TEST_TIMES = 1e6;

describe('test probility', () => {
  it('test randomBetween', () => {
    let ones = 0;
    let twos = 0;
    let threes = 0;

    for (let i = 0; i < TEST_TIMES; ++i) {
      const num = randomBetween(0, Math.PI);
      if (num >= 1 && num < 2) ones++;
      if (num >= 2 && num < 3) twos++;
      if (num >= 3) threes++;
    }

    console.log(`1: ${ones}, 2: ${twos}, 3: ${threes}`);
    console.log(`3 <= x < PI: ${threes / TEST_TIMES}`);

    expect(Math.abs(ones / (ones + twos)) - 1 / 2).toBeLessThan(0.01);
    expect(Math.abs(twos / (ones + twos)) - 1 / 2).toBeLessThan(0.01);
    expect(Math.abs(threes / TEST_TIMES - (Math.PI - 3) / Math.PI)).toBeLessThan(0.01);
  });

  function thrwoNeedleOnce(opts: ThrowNeedleTest) {
    const { l, d } = opts;

    // 直线固定使用y=0和y=d
    // 随机选中0~d之间的一点作为针落地的一个端点
    const h = randomBetween(0, d);
    // 随机一个角度
    const theta = randomBetween(0, 0.5 * Math.PI);
    const sin = Math.sin(theta);
    // 计算针的另一个端点的高度
    const H = l * sin + h;
    // 针中点到y = c的距离
    const x = (l * sin) / 2 + d - H;

    return {
      x: d - x > x ? x : d - x,
      theta,
    };
  }

  function throwNeedle(opts: ThrowNeedleTest) {
    const { l, d, times } = opts;
    let passed = 0;

    for (let i = 0; i < opts.times; ++i) {
      const { x, theta } = thrwoNeedleOnce(opts);

      // 统计X <= lsin(t)/2的次数
      if (x <= (l * Math.sin(theta)) / 2) passed++;
    }

    const p = passed / times;

    return (2 * l) / d / p;
  }

  it('test PI', () => {
    const PI1 = throwNeedle({
      l: 3,
      d: 5,
      times: TEST_TIMES,
    });

    const PI2 = throwNeedle({
      l: 2,
      d: 3,
      times: TEST_TIMES,
    });

    console.log(PI1);
    console.log(PI2);

    expect(PI1 - Math.PI).toBeLessThan(0.01);
    expect(PI2 - Math.PI).toBeLessThan(0.01);
  });
});
