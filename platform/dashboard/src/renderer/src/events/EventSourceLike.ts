type EventSourceLike = {
  addEventListener(
    evt: "message" | "error",
    handler: (this: EventSourceLike, evt: MessageEvent) => void,
    opts?: boolean,
  ): void

  removeEventListener(evt: "message" | "error", handler: (this: EventSourceLike, evt: MessageEvent) => void): void

  close(): void
}

export default EventSourceLike
