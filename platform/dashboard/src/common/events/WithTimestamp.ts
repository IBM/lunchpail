type WithTimestamp<Event> = {
  event: Event
  timestamp: number
  metadata: {
    name: string
    namespace: string
    annotations: {
      "codeflare.dev/status": string
    }
  }
}

export default WithTimestamp
