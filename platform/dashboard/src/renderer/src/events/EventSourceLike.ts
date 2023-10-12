export type EventLike = { data: string }
export type Handler = (/*this: EventSourceLike,*/ evt: EventLike) => void

type EventSourceLike = {
  addEventListener(evt: "message" | "error", handler: Handler, opts?: boolean): void

  removeEventListener(evt: "message" | "error", handler: (this: EventSourceLike, evt: MessageEvent) => void): void

  close(): void
}

export default EventSourceLike
