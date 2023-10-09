import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { Dashboard } from "../pages/Dashboard"

import DemoQueueEventSource from "./streams/queue"
import DemoDataSetEventSource from "./streams/dataset"
import DemoWorkerPoolStatusEventSource from "./streams/pool"
import DemoApplicationSpecEventSource from "./streams/application"

import type { EventProps } from "../pages/Dashboard"

let props: null | EventProps = null

function init() {
  if (props === null) {
    const queues = new DemoQueueEventSource()
    const datasets = new DemoDataSetEventSource()
    const pools = new DemoWorkerPoolStatusEventSource(datasets, queues)
    const applications = new DemoApplicationSpecEventSource()

    props = {
      datasets,
      pools,
      newpool: pools,
      queues,
      applications,
    }
  }

  return props
}

export default function DemoDashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const searchParams = useSearchParams()

  return <Dashboard {...init()} location={location} navigate={navigate} searchParams={searchParams[0]} />
}
