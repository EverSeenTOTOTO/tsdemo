import { ExtendArray, ExtendMap, ExtendSet, flattern } from '@/utils';

describe('test utils', () => {
  test('test ExtendMap', () => {
    const emptyMap = new ExtendMap<string, string>();

    expect(emptyMap.length).toBe(0);

    const map = new ExtendMap<string, string>([
      ['a', 'b'],
      ['b', 'd'],
    ]);

    expect(map.vs()).toEqual(['b', 'd']);
  });

  test('test ExtendSet', () => {
    const emptySet = new ExtendSet<string>();

    expect(emptySet.length).toBe(0);

    const set = new ExtendSet<string>(['a', 'a', 'b']);

    expect(set.vs()).toEqual(['a', 'b']);
    expect(ExtendSet.isSame(emptySet, set)).toBe(false);

    set.addMultiple(['c', 'b']);

    expect(set.length).toBe(3);
  });

  test('test subsets', () => {
    expect(
      ExtendSet.None.subsets()
        .vs()
        .map(each => each.vs()),
    ).toEqual([[]]);
    expect(
      new ExtendSet([1, 2, 3])
        .subsets()
        .vs()
        .map(each => each.vs()),
    ).toEqual([[], [1], [2], [3], [1, 2], [1, 3], [2, 3], [1, 2, 3]]);
    expect(new ExtendSet([1, 2, 3, 4, 5]).subsets().vs().length).toBe(2 ** 5);
  });

  test('test flattern', () => {
    expect(flattern([])).toEqual([]);
    expect(flattern([[]])).toEqual([]);
    expect(
      flattern([
        [1, 2],
        [3, 4],
      ]),
    ).toEqual([1, 2, 3, 4]);
  });

  test('test ExtendArray', () => {
    const l1: ExtendArray<number> = [1, 2];
    const l2: ExtendArray<number> = [1, 2, 3];

    expect(ExtendArray.isSame(l1, l2)).toBe(false);

    l2.splice(2, 1);

    expect(ExtendArray.isSame(l1, l2)).toBe(true);

    l2.splice(1, 1);

    expect(ExtendArray.isSame(l1, l2)).toBe(false);

    l1.splice(0, l1.length);

    expect(ExtendArray.isSame(l1, l2)).toBe(false);
    expect(ExtendArray.isSame(l1, [])).toBe(true);
  });
});
