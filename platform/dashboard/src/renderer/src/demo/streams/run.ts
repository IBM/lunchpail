import type RunEvent from "@jaas/common/events/RunEvent"
import type EventSourceLike from "@jaas/common/events/EventSourceLike"

import context from "../context"
import Base, { applications } from "./application"

export default class DemoRunSpecEventSource extends Base implements EventSourceLike {
  private readonly runs: RunEvent[] = applications.map((application) => ({
    apiVersion: "codeflare.dev/v1alpha1",
    kind: "Run",
    metadata: {
      name: application.name,
      namespace: application.namespace,
      context,
      creationTimestamp: new Date().toLocaleString(),
      annotations: {
        "codeflare.dev/status": "Running",
      },
    },
    spec: {
      application: {
        name: application.name,
      },
    },
  }))

  private withStatus(status: RunEvent["metadata"]["annotations"]["codeflare.dev/status"], run: RunEvent) {
    // ok to update in place, as `run` comes from `this.runs` which is supposed to be our current state
    if (status === run.metadata.annotations["codeflare.dev/status"]) {
      return run
    } else {
      run.metadata.annotations["codeflare.dev/status"] = status
      return Object.assign({}, run)
    }
  }

  private sendEventForRun = (run: RunEvent, status = run.metadata.annotations["codeflare.dev/status"]) => {
    this.handlers.forEach((handler) =>
      handler(new MessageEvent("run", { data: JSON.stringify([this.withStatus(status, run)]) })),
    )
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { runs, sendEventForRun } = this

      this.interval = setInterval(
        (function interval() {
          const whichToUpdate = Math.floor(Math.random() * runs.length)
          sendEventForRun(runs[whichToUpdate])
          return interval
        })(), // () means invoke the interval right away
        intervalMillis,
      )
    }
  }

  public override delete(props: { name: string; namespace: string; context: string }) {
    const idx = this.runs.findIndex(
      (_) =>
        _.metadata.name === props.name &&
        _.metadata.namespace === props.namespace &&
        _.metadata.context === props.context,
    )
    if (idx >= 0) {
      const model = this.runs[idx]
      this.runs.splice(idx, 1)
      this.sendEventForRun(model, "Terminating")
      return true
    } else {
      return {
        code: 404,
        message: "Resource not found",
      }
    }
  }
}
