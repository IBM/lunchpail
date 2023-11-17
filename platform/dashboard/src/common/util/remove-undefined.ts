/**
 * @return a copy of array `A` with any `undefined` elements removed
 */
export default function removeUndefined<T>(A: T[]) {
  return A.filter((a): a is Exclude<T, undefined> => !!a)
}
