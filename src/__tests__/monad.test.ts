import { Box, map } from '../monad';

const identity = <T>(x: T) => x;

it('test identity law', () => {
  const x = Box.of(42);
  const mapped = map(identity)(x);

  expect(mapped.value).toBe(x.value);
});
