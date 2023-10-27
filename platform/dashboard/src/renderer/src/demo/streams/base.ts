import type ExecResponse from "@jay/common/events/ExecResponse"

type Handler = (evt: MessageEvent) => void

export default abstract class DemoEventSource {
  /** Listeners for our ApplicationSpecEvent stream */
  protected readonly handlers: Handler[] = []

  /** Interval over which we send ApplicationSpecEvent */
  protected interval: null | ReturnType<typeof setInterval> = null

  protected abstract initInterval(intervalMillis: number): void

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public delete(_props: { name: string; namespace: string }): ExecResponse {
    return {
      code: 1,
      message: "Unsupported operation",
    }
  }

  public constructor(private readonly intervalMillis = 2000) {}

  public addEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      this.handlers.push(handler)
      this.initInterval(this.intervalMillis)
    }
  }

  public removeEventListener(evt: "message" | "error", handler: Handler) {
    if (evt === "message") {
      const idx = this.handlers.findIndex((_) => _ === handler)
      if (idx >= 0) {
        this.handlers.splice(idx, 1)
      }
    }
  }

  public on(source: "message", cb: import("@jay/common/api/jay").OnModelUpdateFn) {
    const mycb: Handler = (evt) => cb({}, evt)
    addEventListener(source, mycb)
    return () => removeEventListener(source, mycb)
  }

  public close() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}
