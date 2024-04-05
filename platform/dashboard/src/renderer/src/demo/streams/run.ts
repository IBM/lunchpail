import type RunEvent from "@jaas/common/events/RunEvent"
import type EventSourceLike from "@jaas/common/events/EventSourceLike"

import colors from "./colors"
import context from "../context"
import Base, { applications } from "./application"

export const runs: RunEvent[] = applications.map((application, applicationIdx) => ({
  apiVersion: "lunchpail.io/v1alpha1",
  kind: "Run",
  metadata: {
    name: application.name,
    namespace: application.namespace,
    context,
    creationTimestamp: new Date().toLocaleString(),
    annotations: {
      "jaas.dev/taskqueue": colors[applicationIdx],
      "lunchpail.io/status": "Running",
    },
  },
  spec: {
    application: {
      name: application.name,
    },
  },
}))

export default class DemoRunSpecEventSource extends Base implements EventSourceLike {
  private withStatus(status: RunEvent["metadata"]["annotations"]["lunchpail.io/status"], run: RunEvent) {
    // ok to update in place, as `run` comes from `runs` which is supposed to be our current state
    if (status === run.metadata.annotations["lunchpail.io/status"]) {
      return run
    } else {
      run.metadata.annotations["lunchpail.io/status"] = status
      return Object.assign({}, run)
    }
  }

  private sendEventForRun = (run: RunEvent, status = run.metadata.annotations["lunchpail.io/status"]) => {
    this.handlers.forEach((handler) =>
      handler(new MessageEvent("run", { data: JSON.stringify([this.withStatus(status, run)]) })),
    )
  }

  protected override initInterval(intervalMillis: number) {
    if (!this.interval) {
      const { sendEventForRun } = this

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
    const idx = runs.findIndex(
      (_) =>
        _.metadata.name === props.name &&
        _.metadata.namespace === props.namespace &&
        _.metadata.context === props.context,
    )
    if (idx >= 0) {
      const model = runs[idx]
      runs.splice(idx, 1)
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
