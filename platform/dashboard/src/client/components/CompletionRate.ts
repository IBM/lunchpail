function prettyRate(tasksPerMilli: number) {
  const tasksPerSecond = tasksPerMilli * 1000

  if (tasksPerMilli === 0 || isNaN(tasksPerMilli)) {
    return ""
  } else if (tasksPerSecond < 1) {
    const tasksPerMinute = tasksPerSecond * 60
    if (tasksPerMinute < 1) {
      const tasksPerHour = tasksPerMinute * 60
      if (tasksPerHour < 1) {
        const tasksPerDay = tasksPerHour * 24
        return Math.round(tasksPerDay) + " tasks/day"
      } else {
        return Math.round(tasksPerHour) + " tasks/hr"
      }
    } else {
      return Math.round(tasksPerMinute) + " tasks/min"
    }
  } else {
    return Math.round(tasksPerSecond) + " tasks/sec"
  }
}

export function completionRateHistory(history: { outbox: number; timestamp: number }[]) {
  return history.map(({ outbox, timestamp }, idx) =>
    idx === 0 ? 0 : outbox / (timestamp - history[idx - 1].timestamp || 1),
  )
}

export function meanCompletionRate(history: { outbox: number; timestamp: number }[]) {
  const rateHistory = completionRateHistory(history)
  const N = rateHistory.length
  const sum = rateHistory.reduce((sum, val) => sum + val)
  return N === 0 ? 0 : prettyRate(sum / N) || 0
}

export function medianCompletionRate(history: { outbox: number; timestamp: number }[]) {
  const A = completionRateHistory(history).sort()
  return A.length === 0 ? 0 : prettyRate(A[Math.round(A.length / 2)]) || 0
}
