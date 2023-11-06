export default function either<T>(x: T | undefined, y: T): T {
  return x === undefined ? y : x
}
