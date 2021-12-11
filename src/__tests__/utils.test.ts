import { ExtendMap, ExtendSet } from '@/utils';

describe('test utils', () => {
  test('test ExtendMap', () => {
    const emptyMap = new ExtendMap<string, string>();

    expect(emptyMap.length).toBe(0);

    const map = new ExtendMap<string, string>(
      [
        ['a', 'b'],
        ['b', 'd'],
      ],
    );

    expect(map.vs()).toEqual([
      'b', 'd',
    ]);
  });

  test('test ExtendSet', () => {
    const emptySet = new ExtendSet<string>();

    expect(emptySet.length).toBe(0);

    const set = new ExtendSet<string>([
      'a', 'a', 'b',
    ]);

    expect(set.vs()).toEqual(['a', 'b']);
    expect(ExtendSet.isSame(emptySet, set)).toBe(false);

    set.addMultiple(['c', 'b']);

    expect(set.length).toBe(3);
  });
});
