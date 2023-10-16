import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { Dashboard } from "../pages/Dashboard"

import NothingEventSource from "./streams/nothing"
import DemoQueueEventSource from "./streams/queue"
import DemoDataSetEventSource from "./streams/dataset"
import DemoWorkerPoolStatusEventSource from "./streams/pool"
import DemoApplicationSpecEventSource from "./streams/application"

import type { EventProps } from "../pages/Dashboard"

let props: null | (EventProps & { workerpools: DemoWorkerPoolStatusEventSource }) = null

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
  return (
    <Dashboard
      {...props}
      createResource={props.workerpools.createResource.bind(props.workerpools)}
      location={location}
      navigate={navigate}
      searchParams={searchParams[0]}
    />
  )
}
