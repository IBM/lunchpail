/**
 * The algorithm from which the function below is based off of:
 *  https://en.wikipedia.org/wiki/Change-making_problem
 */
export default function gridCellStacking(coins: number[], amount: number): number {
  // Intialize results array with arbitrary maximum. In this case, amount+1
  const m: number[] = []
  for (let i = 0; i < amount + 1; i++) {
    m[i] = amount + 1
  }
  // There are exactly 0 ways to return 0 cents
  m[0] = 0

  // Dynamically search for minimum number of coins who's sum is 'amount'
  for (let coinIdx = 0; coinIdx < coins.length; coinIdx++) {
    const curCoin = coins[coinIdx]

    // Bottom up search for minimum number of coins needed to achieve curSubAmount
    for (let curSubAmount = 1; curSubAmount < amount + 1; curSubAmount++) {
      if (curCoin === curSubAmount) {
        // Then we just used one coin
        m[curSubAmount] = 1
      } else if (curCoin < curSubAmount) {
        // Find and use minimum number of coins to reach curSubAmount
        m[curSubAmount] = Math.min(m[curSubAmount - curCoin] + 1, m[curSubAmount])
      }
    }
  }

  return m[amount]
}
