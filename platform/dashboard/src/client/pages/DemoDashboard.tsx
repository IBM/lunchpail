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
    const pools = new DemoWorkerPoolStatusEventSource()

    props = {
      datasets: new DemoDataSetEventSource(),
      pools,
      newpool: pools,
      queues: new DemoQueueEventSource(pools),
      applications: new DemoApplicationSpecEventSource(),
    }
  }

  return props
}

export default function DemoDashboard() {
  const location = useLocation()
  const navigate = useNavigate()

  return <Dashboard {...init()} location={location} navigate={navigate} />
}
