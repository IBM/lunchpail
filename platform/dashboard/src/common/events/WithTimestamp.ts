type WithTimestamp<Event> = {
  event: Event
  timestamp: number
  metadata: {
    name: string
    context: string
    namespace: string
    annotations: {
      "lunchpail.io/status": string
    }
  }
}

export default WithTimestamp
