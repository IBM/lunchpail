import { useLocation, useNavigate } from "react-router-dom"

import { Dashboard, EventProps } from "./Dashboard"
import {
  DemoDataSetEventSource,
  DemoQueueEventSource,
  DemoWorkerPoolStatusEventSource,
  DemoApplicationSpecEventSource,
} from "../events/demo"

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

  return <Dashboard {...init()} location={location} navigate={navigate} />
}
