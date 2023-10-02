/** This is adding missing types for the following npm: https://www.npmjs.com/package/change-maker */
declare module "change-maker" {
  export default function makeChange(value: string, coins: number[]): Record<string, number>
}
