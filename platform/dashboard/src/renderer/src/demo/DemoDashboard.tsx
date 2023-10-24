import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { Dashboard } from "../pages/Dashboard"

import NothingEventSource from "./streams/nothing"
import DemoQueueEventSource from "./streams/queue"
import DemoDataSetEventSource from "./streams/dataset"
import DemoWorkerPoolStatusEventSource from "./streams/pool"
import DemoApplicationSpecEventSource from "./streams/application"

import type WatchedKind from "@jay/common/Kind"
import type DemoEventSource from "./streams/base"

let props: null | (Record<WatchedKind, DemoEventSource> & { workerpools: DemoWorkerPoolStatusEventSource }) = null

function init() {
  if (props === null) {
    const queues = new DemoQueueEventSource()
    const datasets = new DemoDataSetEventSource()
    const workerpools = new DemoWorkerPoolStatusEventSource(datasets, queues)
    const applications = new DemoApplicationSpecEventSource()
    const platformreposecrets = new NothingEventSource()

    props = {
      datasets,
      workerpools,
      queues,
      applications,
      platformreposecrets,
    }
  }

  return props
}

export default function DemoDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()

  const props = init()

  window.jay = window.demo = Object.assign({}, props, {
    create: props.workerpools.create.bind(props.workerpools),
    delete(dprops: import("@jay/common/api/jay").DeleteProps) {
      if (/workerpool/.test(dprops.kind)) {
        return props.workerpools.delete(dprops)
      } else if (/application/.test(dprops.kind)) {
        return props.applications.delete(dprops)
      } else if (/dataset/.test(dprops.kind)) {
        return props.datasets.delete(dprops)
      } else {
        return false
      }
    },
    controlplane: {
      async status() {
        return {
          location: "demo",
          cluster: true,
          runtime: true,
          examples: false,
          defaults: false,
        }
      },
      init() {},
      update() {},
      destroy() {},
    },
  })

  return <Dashboard {...props} location={location} navigate={navigate} searchParams={searchParams[0]} />
}
