import type { QueueHistory } from "./WorkerPoolModel"

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

export function completionRateHistory(history: QueueHistory) {
  const { outboxHistory, timestamps } = history
  return outboxHistory.map((completions, idx) =>
    idx === 0 ? 0 : completions / (timestamps[idx] - timestamps[idx - 1] || 1),
  )
}

export function instantaneousCompletionRate(history: QueueHistory) {
  const { outboxHistory, timestamps } = history
  const N = timestamps.length

  if (N <= 1) {
    return ""
  } else {
    const durationMillis = timestamps[N - 1] - timestamps[N - 2]
    return prettyRate(outboxHistory[N - 1] / durationMillis)
  }
}

export function meanCompletionRate(history: QueueHistory) {
  const rateHistory = completionRateHistory(history)
  const N = rateHistory.length
  const sum = rateHistory.reduce((sum, val) => sum + val)
  return sum / N
}

export function medianCompletionRate(history: QueueHistory) {
  const A = completionRateHistory(history).sort()
  return A.length === 0 ? 0 : prettyRate(A[Math.round(A.length / 2)]) || 0
}
