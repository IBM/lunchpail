import { Dashboard } from "../pages/Dashboard"

import NothingEventSource from "./streams/nothing"
import DemoQueueEventSource from "./streams/queue"
import DemoTaskQueueEventSource from "./streams/taskqueue"
import DemoWorkerPoolStatusEventSource from "./streams/pool"
import DemoApplicationSpecEventSource from "./streams/application"

import type WatchedKind from "@jay/common/Kind"
import type DemoEventSource from "./streams/base"
import type KubernetesResource from "@jay/common/events/KubernetesResource"

let props: null | (Record<WatchedKind, DemoEventSource> & { workerpools: DemoWorkerPoolStatusEventSource }) = null

function init() {
  if (props === null) {
    const queues = new DemoQueueEventSource()
    const taskqueues = new DemoTaskQueueEventSource()
    const workerpools = new DemoWorkerPoolStatusEventSource(taskqueues, queues)
    const applications = new DemoApplicationSpecEventSource()

    props = {
      computetargets: new NothingEventSource(),
      taskqueues,
      datasets: new NothingEventSource(),
      workerpools,
      queues,
      applications,
      platformreposecrets: new NothingEventSource(),
      workdispatchers: new NothingEventSource(),
    }
  }

  return props
}

export default function DemoDashboard() {
  const props = init()

  if (!window.demo) {
    window.jay = window.demo = Object.assign({}, props, {
      create: props.workerpools.create.bind(props.workerpools),

      async delete(yaml: string) {
        const { loadAll } = await import("js-yaml")
        const rsrcs = loadAll(yaml) as KubernetesResource[]
        await Promise.all(
          rsrcs.map((rsrc) =>
            window.demo.deleteByName({
              kind: rsrc.kind.toLowerCase() + "s",
              name: rsrc.metadata.name,
              namespace: rsrc.metadata.namespace,
            }),
          ),
        )
        return true as const
      },

      deleteByName(dprops: import("@jay/common/api/jay").DeleteProps) {
        if (/workerpool/.test(dprops.kind)) {
          return props.workerpools.delete(dprops)
        } else if (/application/.test(dprops.kind)) {
          return props.applications.delete(dprops)
        } else if (/taskqueue/.test(dprops.kind)) {
          return props.taskqueues.delete(dprops)
        } else {
          return {
            code: 404,
            message: "Resource not found",
          }
        }
      },
      controlplane: {
        async status() {
          return {
            location: "demo",
            podmanCli: true,
            podmanMachine: true,
            kubernetesCluster: true,
            jaasRuntime: true,
            examples: false,
            defaults: false,
          }
        },
        init() {},
        update() {},
        destroy() {},
      },
    })
  }

  return <Dashboard {...props} />
}
